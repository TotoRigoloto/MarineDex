// Scanner v2
// - Choix caméra OU galerie (lancement direct)
// - Affichage Top 3 prédictions avec barres de confiance
// - Sélecteur de voyage dans le modal de validation
// - Sauvegarde dans l'historique de scans (md_scans côté cloud)
// - Tolère un backend qui ne renvoie qu'un seul résultat (fallback)
import {
  Animal,
  ENCYCLOPEDIA_DATA,
  GEOGRAPHY_DB,
  initialAnimals,
  Observation,
  Trip,
} from "@/constants/MarineData";
import { STORAGE_KEYS } from "@/constants/Storage";
import { supabase } from "@/services/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ⚠️ URL backend IA — à externaliser dans app.json → extra.aiUrl idéalement.
const API_URL = "https://silly-squids-clap.loca.lt/predict";

interface Prediction {
  species: string;
  confidence: number;
}

export default function HomeScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Modal validation
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [chosenSpecies, setChosenSpecies] = useState<string>("");
  const [locationInput, setLocationInput] = useState<string>("");
  const [tempPhotoUri, setTempPhotoUri] = useState<string>("");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [obsTripId, setObsTripId] = useState<string | undefined>(undefined);

  // ============== PHOTO PICK ==============
  const ensurePermission = async (kind: "camera" | "gallery") => {
    if (kind === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === "granted";
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === "granted";
  };

  const launchCamera = async () => {
    if (!(await ensurePermission("camera"))) {
      Alert.alert(
        "Permission refusée",
        "Active l'accès à l'appareil photo dans les réglages.",
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setSelectedImage(uri);
      await uploadImage(uri);
    }
  };

  const launchGallery = async () => {
    if (!(await ensurePermission("gallery"))) {
      Alert.alert("Permission refusée", "Active l'accès aux photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setSelectedImage(uri);
      await uploadImage(uri);
    }
  };

  // ============== UPLOAD IA ==============
  const uploadImage = async (uri: string) => {
    setLoading(true);
    const fd = new FormData();
    fd.append("file", {
      uri,
      name: "photo.jpg",
      type: "image/jpeg",
    } as any);

    try {
      const r = await fetch(API_URL, {
        method: "POST",
        body: fd,
        headers: { "Content-Type": "multipart/form-data" },
      });
      const j = await r.json();

      // Le backend renvoie soit {species, confidence?, alternatives?[]},
      // soit juste {species}. On normalise.
      const preds: Prediction[] = [];
      if (Array.isArray(j.alternatives) && j.alternatives.length > 0) {
        j.alternatives.slice(0, 3).forEach((a: any) => {
          if (a.species)
            preds.push({
              species: String(a.species),
              confidence: Number(a.confidence ?? 0),
            });
        });
      } else if (j.species) {
        preds.push({
          species: String(j.species),
          confidence: Number(j.confidence ?? 1),
        });
      }

      if (preds.length === 0) {
        Alert.alert("Zut", "L'IA n'a rien reconnu sur cette image.");
        return;
      }

      // Charge les voyages pour le sélecteur
      const savedTrips = await AsyncStorage.getItem(STORAGE_KEYS.TRIPS);
      setTrips(savedTrips ? JSON.parse(savedTrips) : []);

      setPredictions(preds);
      setChosenSpecies(preds[0].species);
      setTempPhotoUri(uri);
      setLocationInput("");
      setObsTripId(undefined);
      setShowValidationModal(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    } catch {
      Alert.alert(
        "Erreur réseau",
        "Impossible de joindre le serveur IA. Vérifie ta connexion.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ============== SAVE ==============
  const saveObservation = async () => {
    setShowValidationModal(false);
    try {
      // A. POKEDEX (déblocage par nom)
      const savedPokedex = await AsyncStorage.getItem(STORAGE_KEYS.POKEDEX);
      let currentAnimals: Animal[] = savedPokedex
        ? JSON.parse(savedPokedex)
        : initialAnimals;
      let foundNew = false;

      const updatedAnimals = currentAnimals.map((animal: Animal) => {
        const appName = animal.name.toLowerCase();
        const aiName = chosenSpecies.toLowerCase();
        if (
          appName === aiName ||
          aiName.includes(appName) ||
          appName.includes(aiName)
        ) {
          if (!animal.discovered) foundNew = true;
          return { ...animal, discovered: true };
        }
        return animal;
      });
      if (foundNew) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.POKEDEX,
          JSON.stringify(updatedAnimals),
        );
        Alert.alert("Bravo !", `Tu as débloqué : ${chosenSpecies} !`);
      }

      // B. JOURNAL
      let detectedOcean = "Non précisé";
      const cleanLocation = locationInput.trim();
      if (cleanLocation) {
        const countryKey = Object.keys(GEOGRAPHY_DB).find(
          (k) => k.toLowerCase() === cleanLocation.toLowerCase(),
        );
        if (countryKey) detectedOcean = GEOGRAPHY_DB[countryKey][0];
      }

      const newLog: Observation = {
        id: Date.now().toString(),
        speciesName: chosenSpecies,
        date: new Date().toLocaleDateString(),
        userPhoto: tempPhotoUri,
        location: cleanLocation || "Inconnu",
        ocean: detectedOcean,
        notes: "Identifié via le Scanner IA",
        tripId: obsTripId,
      };
      const savedLogs = await AsyncStorage.getItem(STORAGE_KEYS.LOGS);
      const currentLogs = savedLogs ? JSON.parse(savedLogs) : [];
      const updatedLogs = [newLog, ...currentLogs];
      await AsyncStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updatedLogs));

      // C. Historique de scans (cloud uniquement, best-effort)
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          await supabase.from("md_scans").insert({
            user_id: userData.user.id,
            predicted_species: predictions[0]?.species ?? chosenSpecies,
            confidence: predictions[0]?.confidence ?? null,
            alternatives: predictions,
            observation_id: newLog.id,
          });
        }
      } catch {
        // pas grave si offline
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ============== UI ==============
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.headerTitle}>🔎 Scanner</Text>
        <Text style={styles.subTitle}>
          Identifie une espèce marine en un éclair
        </Text>

        <View style={styles.bigButtonsRow}>
          <TouchableOpacity
            style={[styles.bigButton, { backgroundColor: "#006994" }]}
            onPress={launchCamera}
            disabled={loading}
          >
            <Text style={styles.bigButtonEmoji}>📷</Text>
            <Text style={styles.bigButtonText}>Caméra</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bigButton, { backgroundColor: "#0288D1" }]}
            onPress={launchGallery}
            disabled={loading}
          >
            <Text style={styles.bigButtonEmoji}>🖼️</Text>
            <Text style={styles.bigButtonText}>Galerie</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#006994" />
            <Text style={styles.loadingTxt}>L&apos;IA analyse ta photo…</Text>
          </View>
        )}

        {selectedImage && !loading && (
          <Image source={{ uri: selectedImage }} style={styles.previewImage} />
        )}

        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>💡 Conseils</Text>
          <Text style={styles.tipTxt}>• Cadre bien l&apos;animal au centre</Text>
          <Text style={styles.tipTxt}>• Préfère la lumière naturelle</Text>
          <Text style={styles.tipTxt}>• Évite les reflets sur l&apos;eau</Text>
        </View>

        {__DEV__ && (
          <Text style={styles.devNote}>
            DEV — Endpoint : {API_URL.split("//")[1].split("/")[0]}
          </Text>
        )}

        {/* ============ MODAL DE VALIDATION ============ */}
        <Modal
          animationType="slide"
          transparent
          visible={showValidationModal}
          onRequestClose={() => setShowValidationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView keyboardShouldPersistTaps="handled">
                <Text style={styles.modalTitle}>✨ Identification</Text>
                <Text style={styles.modalSub}>
                  L&apos;IA propose {predictions.length} possibilité
                  {predictions.length > 1 ? "s" : ""}, choisis la bonne :
                </Text>

                {predictions.map((p, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.predRow,
                      chosenSpecies === p.species && styles.predRowActive,
                    ]}
                    onPress={() => setChosenSpecies(p.species)}
                  >
                    {ENCYCLOPEDIA_DATA[p.species]?.image ? (
                      <Image
                        source={ENCYCLOPEDIA_DATA[p.species].image}
                        style={styles.predImg}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={[styles.predImg, styles.predImgFallback]}>
                        <Text>?</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.predName}>{p.species}</Text>
                      <View style={styles.confBar}>
                        <View
                          style={[
                            styles.confFill,
                            { width: `${Math.round(p.confidence * 100)}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.confTxt}>
                        Confiance : {Math.round(p.confidence * 100)} %
                      </Text>
                    </View>
                    {chosenSpecies === p.species && (
                      <Text style={{ fontSize: 22, color: "#28a745" }}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}

                <Text style={styles.label}>Où as-tu vu cet animal ?</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Costa Rica, La Réunion…"
                  value={locationInput}
                  onChangeText={setLocationInput}
                />

                {trips.length > 0 && (
                  <>
                    <Text style={styles.label}>Rattacher à un voyage :</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <TouchableOpacity
                        style={[
                          styles.tripChip,
                          !obsTripId && styles.tripChipActive,
                        ]}
                        onPress={() => setObsTripId(undefined)}
                      >
                        <Text
                          style={[
                            styles.tripChipTxt,
                            !obsTripId && { color: "white" },
                          ]}
                        >
                          Aucun
                        </Text>
                      </TouchableOpacity>
                      {trips.map((t) => (
                        <TouchableOpacity
                          key={t.id}
                          style={[
                            styles.tripChip,
                            obsTripId === t.id && {
                              backgroundColor: t.color,
                              borderColor: t.color,
                            },
                          ]}
                          onPress={() => setObsTripId(t.id)}
                        >
                          <Text
                            style={[
                              styles.tripChipTxt,
                              obsTripId === t.id && { color: "white" },
                            ]}
                          >
                            🧳 {t.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                )}

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveObservation}
                >
                  <Text style={styles.saveButtonText}>
                    Valider &laquo; {chosenSpecies} &raquo;
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowValidationModal(false)}>
                  <Text style={styles.cancelLink}>Annuler</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f8ff", paddingTop: 50 },
  scroll: { alignItems: "center", paddingBottom: 50 },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#006994",
    textAlign: "center",
    marginBottom: 5,
  },
  subTitle: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    marginBottom: 24,
  },
  bigButtonsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  bigButton: {
    width: 140,
    height: 140,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
  bigButtonEmoji: { fontSize: 50, marginBottom: 4 },
  bigButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  loadingBox: { alignItems: "center", marginVertical: 16 },
  loadingTxt: { color: "#006994", marginTop: 8, fontWeight: "600" },
  previewImage: {
    width: 220,
    height: 220,
    borderRadius: 16,
    marginVertical: 16,
    borderWidth: 3,
    borderColor: "white",
    elevation: 4,
  },
  tipBox: {
    backgroundColor: "white",
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FFB300",
    width: "85%",
  },
  tipTitle: { fontWeight: "bold", color: "#006994", marginBottom: 4 },
  tipTxt: { color: "#555", fontSize: 13, lineHeight: 20 },
  devNote: { marginTop: 20, fontSize: 10, color: "#bbb", fontStyle: "italic" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 22,
    elevation: 10,
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#006994",
    marginBottom: 4,
    textAlign: "center",
  },
  modalSub: {
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    fontSize: 13,
  },
  predRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f6fbff",
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  predRowActive: { borderColor: "#28a745", backgroundColor: "#e8f5e9" },
  predImg: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: "#eee",
  },
  predImgFallback: { justifyContent: "center", alignItems: "center" },
  predName: { fontWeight: "bold", color: "#333", fontSize: 14 },
  confBar: {
    height: 6,
    backgroundColor: "#eee",
    borderRadius: 3,
    marginTop: 4,
    overflow: "hidden",
  },
  confFill: { height: "100%", backgroundColor: "#006994" },
  confTxt: { fontSize: 11, color: "#666", marginTop: 2 },

  label: { fontSize: 14, marginTop: 12, marginBottom: 6, fontWeight: "600", color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#f9f9f9",
  },
  tripChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 8,
    marginTop: 6,
    backgroundColor: "white",
  },
  tripChipActive: { backgroundColor: "#006994", borderColor: "#006994" },
  tripChipTxt: { color: "#333", fontSize: 12, fontWeight: "600" },

  saveButton: {
    backgroundColor: "#28a745",
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 16,
    alignItems: "center",
    elevation: 3,
  },
  saveButtonText: { color: "white", fontWeight: "bold", fontSize: 15 },
  cancelLink: { color: "#dc3545", marginTop: 12, textAlign: "center" },
});
