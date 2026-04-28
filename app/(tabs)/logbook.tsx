import {
  Animal,
  ENCYCLOPEDIA_DATA,
  GEOGRAPHY_DB,
  initialAnimals,
  Observation,
} from "@/constants/MarineData";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView from "react-native-maps";

export default function LogbookScreen() {
  const [logs, setLogs] = useState<Observation[]>([]);

  // États de visibilité (On s'assure qu'un seul est True à la fois)
  const [formVisible, setFormVisible] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);

  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  // Champs Formulaire
  const [speciesInput, setSpeciesInput] = useState("");
  const [filteredSpecies, setFilteredSpecies] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState("");
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);
  const [oceanInput, setOceanInput] = useState("");
  const [oceanOptions, setOceanOptions] = useState<string[]>([]);
  const [dateInput, setDateInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<string | undefined>(
    undefined,
  );

  // Localisation
  const [exactCoords, setExactCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [pickerRegion, setPickerRegion] = useState({
    latitude: 46.2276,
    longitude: 2.2137,
    latitudeDelta: 10,
    longitudeDelta: 10,
  });

  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, []),
  );

  const loadLogs = async () => {
    try {
      const savedLogs = await AsyncStorage.getItem("user_logs");
      if (savedLogs) setLogs(JSON.parse(savedLogs));
      else setLogs([]);
    } catch (e) {
      console.error(e);
    }
  };

  // --- LOGIQUE GPS ---
  const captureGps = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Erreur", "Permission GPS refusée.");
      return;
    }
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    setExactCoords({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
    setPickerRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
    Alert.alert("Succès", "Position GPS capturée ! 🛰️");
  };

  // --- LOGIQUE DE BASCULE DES MODALS (Le correctif est ici !) ---

  // 1. Ouvrir la carte (Ferme le formulaire d'abord)
  const openMapPicker = () => {
    setFormVisible(false); // On cache le formulaire
    setTimeout(() => {
      // Petite pause pour laisser l'animation finir
      setMapVisible(true); // On affiche la carte
    }, 300);
  };

  // 2. Confirmer la carte (Ferme la carte, rouvre le formulaire)
  const confirmMapPick = () => {
    setExactCoords({
      latitude: pickerRegion.latitude,
      longitude: pickerRegion.longitude,
    });
    closeMapAndReopenForm();
  };

  // 3. Annuler la carte
  const closeMapAndReopenForm = () => {
    setMapVisible(false);
    setTimeout(() => {
      setFormVisible(true); // Retour au formulaire
    }, 300);
  };

  // --- GESTION FORMULAIRE ---
  const openNewLogModal = () => {
    setEditingLogId(null);
    setSpeciesInput("");
    setLocationInput("");
    setOceanInput("");
    setOceanOptions([]);
    setDateInput(new Date().toLocaleDateString());
    setNotesInput("");
    setSelectedPhoto(undefined);
    setFilteredSpecies([]);
    setFilteredLocations([]);
    setExactCoords(null);
    setFormVisible(true);
  };

  const openEditLogModal = (item: Observation) => {
    setEditingLogId(item.id);
    setSpeciesInput(item.speciesName);
    setLocationInput(item.location);
    setOceanInput(item.ocean);
    setOceanOptions([]);
    setDateInput(item.date);
    setNotesInput(item.notes || "");
    setSelectedPhoto(item.userPhoto);
    setFilteredSpecies([]);
    setFilteredLocations([]);

    if (item.latitude && item.longitude) {
      setExactCoords({ latitude: item.latitude, longitude: item.longitude });
      setPickerRegion({
        latitude: item.latitude,
        longitude: item.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } else {
      setExactCoords(null);
    }
    setFormVisible(true);
  };

  const pickPhoto = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setSelectedPhoto(result.assets[0].uri);
  };

  // --- AUTOCOMPLÉTIONS ---
  const handleSpeciesChange = (text: string) => {
    setSpeciesInput(text);
    if (text.length > 0) {
      const suggestions = Object.keys(ENCYCLOPEDIA_DATA).filter((s) =>
        s.toLowerCase().includes(text.toLowerCase()),
      );
      setFilteredSpecies(suggestions);
    } else {
      setFilteredSpecies([]);
    }
  };
  const pickSpecies = (name: string) => {
    setSpeciesInput(name);
    setFilteredSpecies([]);
  };

  const handleLocationChange = (text: string) => {
    setLocationInput(text);
    if (text.length > 1) {
      const allCountries = Object.keys(GEOGRAPHY_DB);
      const suggestions = allCountries.filter((c) =>
        c.toLowerCase().includes(text.toLowerCase()),
      );
      setFilteredLocations(suggestions);
    } else {
      setFilteredLocations([]);
    }
  };
  const pickLocation = (country: string) => {
    setLocationInput(country);
    setFilteredLocations([]);
    checkOcean(country);
  };

  const checkOcean = (countryName: string) => {
    const countryKey = Object.keys(GEOGRAPHY_DB).find(
      (k) => k.toLowerCase() === countryName.trim().toLowerCase(),
    );
    if (countryKey) {
      setLocationInput(countryKey);
      const oceans = GEOGRAPHY_DB[countryKey];
      if (oceans.length === 1) {
        setOceanInput(oceans[0]);
        setOceanOptions([]);
      } else {
        setOceanOptions(oceans);
        setOceanInput("");
      }
    } else {
      setOceanOptions([]);
    }
  };

  // --- SAUVEGARDE ---
  const saveLog = async () => {
    if (!speciesInput.trim()) {
      Alert.alert("Erreur", "Nom d'espèce obligatoire !");
      return;
    }

    const logData: Observation = {
      id: editingLogId || Date.now().toString(),
      speciesName: speciesInput,
      date: dateInput,
      location: locationInput || "Inconnu",
      ocean: oceanInput || "Non précisé",
      notes: notesInput,
      userPhoto: selectedPhoto,
      latitude: exactCoords?.latitude,
      longitude: exactCoords?.longitude,
    };

    try {
      let updatedLogs;
      if (editingLogId) {
        updatedLogs = logs.map((log) =>
          log.id === editingLogId ? logData : log,
        );
        Alert.alert("Mis à jour", "L'observation a été modifiée ! ✏️");
      } else {
        updatedLogs = [logData, ...logs];
        await checkPokedexUnlock(speciesInput);
        Alert.alert("Succès", "Nouvelle observation ajoutée ! 📸");
      }
      setLogs(updatedLogs);
      await AsyncStorage.setItem("user_logs", JSON.stringify(updatedLogs));
      setFormVisible(false);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteLog = async () => {
    Alert.alert("Supprimer", "Es-tu sûr ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          const updatedLogs = logs.filter((log) => log.id !== editingLogId);
          setLogs(updatedLogs);
          await AsyncStorage.setItem("user_logs", JSON.stringify(updatedLogs));
          setFormVisible(false);
        },
      },
    ]);
  };

  const checkPokedexUnlock = async (name: string) => {
    const savedPokedex = await AsyncStorage.getItem("pokedex_save");
    let currentAnimals: Animal[] = savedPokedex
      ? JSON.parse(savedPokedex)
      : initialAnimals;
    let found = false;
    const updatedAnimals = currentAnimals.map((animal) => {
      if (animal.name.trim().toLowerCase() === name.trim().toLowerCase()) {
        found = true;
        return { ...animal, discovered: true };
      }
      return animal;
    });
    if (found)
      await AsyncStorage.setItem(
        "pokedex_save",
        JSON.stringify(updatedAnimals),
      );
  };

  const renderLogItem = ({ item }: { item: Observation }) => {
    const encycloInfo = ENCYCLOPEDIA_DATA[item.speciesName];
    let imageSource;
    if (item.userPhoto) imageSource = { uri: item.userPhoto };
    else if (encycloInfo) imageSource = encycloInfo.image;

    return (
      <TouchableOpacity
        onPress={() => openEditLogModal(item)}
        activeOpacity={0.7}
      >
        <View style={styles.logCard}>
          {imageSource ? (
            <Image source={imageSource} style={styles.logImage} />
          ) : (
            <View
              style={[
                styles.logImage,
                {
                  backgroundColor: "#eee",
                  justifyContent: "center",
                  alignItems: "center",
                },
              ]}
            >
              <Text style={{ fontSize: 20 }}>?</Text>
            </View>
          )}
          <View style={styles.logInfo}>
            <Text style={styles.logSpecies}>{item.speciesName}</Text>
            <Text style={styles.logDetail}>📅 {item.date}</Text>
            <Text style={styles.logDetail}>
              📍 {item.location} ({item.ocean})
            </Text>
            {item.latitude && item.longitude && (
              <Text style={{ fontSize: 10, color: "green" }}>📍 Localisé</Text>
            )}
          </View>
          <Text
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              fontSize: 14,
              opacity: 0.5,
            }}
          >
            ✏️
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>📔 Journal de Bord</Text>
        <TouchableOpacity style={styles.addButton} onPress={openNewLogModal}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {logs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Ton carnet est vide.</Text>
          <Text style={styles.emptySubText}>Ajoute une observation (+)</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          renderItem={renderLogItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}

      {/* --- MODAL 1 : FORMULAIRE --- */}
      <Modal visible={formVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.modalTitle}>
                  {editingLogId ? "Modifier" : "Nouvelle Observation"}
                </Text>

                {/* Photo */}
                <View style={{ alignItems: "center", marginBottom: 15 }}>
                  <TouchableOpacity
                    onPress={pickPhoto}
                    style={styles.photoButton}
                  >
                    {selectedPhoto ? (
                      <Image
                        source={{ uri: selectedPhoto }}
                        style={styles.photoPreview}
                      />
                    ) : (
                      <View style={{ alignItems: "center" }}>
                        <Text style={{ fontSize: 24 }}>📷</Text>
                        <Text style={{ fontSize: 12, color: "#006994" }}>
                          {editingLogId ? "Changer" : "Ajouter"}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Espèce */}
                <Text style={styles.label}>Espèce :</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Requin..."
                  value={speciesInput}
                  onChangeText={handleSpeciesChange}
                  returnKeyType="done"
                />
                {filteredSpecies.length > 0 && (
                  <View style={styles.suggestionsBox}>
                    {filteredSpecies.map((s, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => pickSpecies(s)}
                        style={styles.suggestionItem}
                      >
                        <Text>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Lieu */}
                <Text style={styles.label}>Pays / Lieu :</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: France..."
                  value={locationInput}
                  onChangeText={handleLocationChange}
                  onBlur={() => checkOcean(locationInput)}
                  returnKeyType="done"
                />
                {filteredLocations.length > 0 && (
                  <View style={styles.suggestionsBox}>
                    {filteredLocations.map((loc, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => pickLocation(loc)}
                        style={styles.suggestionItem}
                      >
                        <Text>{loc}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* --- SÉLECTEUR DE POSITION --- */}
                <Text style={styles.label}>
                  Localisation précise (Optionnel) :
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 15,
                  }}
                >
                  <TouchableOpacity
                    style={styles.locationBtn}
                    onPress={captureGps}
                  >
                    <Text style={styles.locationBtnText}>📍 Ma position</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.locationBtn, { backgroundColor: "#009688" }]}
                    onPress={openMapPicker}
                  >
                    <Text style={styles.locationBtnText}>🗺️ Sur la carte</Text>
                  </TouchableOpacity>
                </View>
                {exactCoords ? (
                  <Text
                    style={{
                      textAlign: "center",
                      color: "green",
                      fontSize: 12,
                      marginBottom: 10,
                    }}
                  >
                    ✅ Coordonnées GPS enregistrées
                  </Text>
                ) : (
                  <Text
                    style={{
                      textAlign: "center",
                      color: "#888",
                      fontSize: 12,
                      marginBottom: 10,
                      fontStyle: "italic",
                    }}
                  >
                    (Par défaut : Centre du pays)
                  </Text>
                )}

                {oceanOptions.length > 0 ? (
                  <View style={{ marginBottom: 10 }}>
                    <Text style={{ fontSize: 12, color: "orange" }}>
                      Zone :
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                      {oceanOptions.map((opt) => (
                        <TouchableOpacity
                          key={opt}
                          onPress={() => {
                            setOceanInput(opt);
                            setOceanOptions([]);
                          }}
                          style={styles.oceanTag}
                        >
                          <Text style={{ color: "white", fontSize: 12 }}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : (
                  // CORRECTION : On remplace le Text par un TextInput modifiable
                  <View style={{ marginBottom: 15 }}>
                    <Text style={styles.label}>Océan :</Text>
                    <TextInput
                      style={styles.input}
                      value={oceanInput}
                      onChangeText={setOceanInput}
                      placeholder="Ex: Atlantique, Pacifique..."
                    />
                  </View>
                )}

                <Text style={styles.label}>Date :</Text>
                <TextInput
                  style={styles.input}
                  value={dateInput}
                  onChangeText={setDateInput}
                  returnKeyType="done"
                />

                <Text style={styles.label}>Notes :</Text>
                <TextInput
                  style={[styles.input, { height: 80 }]}
                  multiline
                  placeholder="Détails, profondeur..."
                  value={notesInput}
                  onChangeText={setNotesInput}
                />

                <View style={styles.btnRow}>
                  {editingLogId && (
                    <TouchableOpacity
                      style={styles.btnDelete}
                      onPress={deleteLog}
                    >
                      <Text style={styles.btnText}>🗑️</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.btnCancel}
                    onPress={() => setFormVisible(false)}
                  >
                    <Text style={styles.btnText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnSave} onPress={saveLog}>
                    <Text style={styles.btnText}>
                      {editingLogId ? "Mettre à jour" : "Sauvegarder"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- MODAL 2 : CARTE SÉLECTEUR (Indépendante) --- */}
      <Modal visible={mapVisible} animationType="slide">
        <View style={{ flex: 1 }}>
          <MapView
            style={{ flex: 1 }}
            region={pickerRegion}
            onRegionChangeComplete={(region) => setPickerRegion(region)}
          ></MapView>

          <View
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              marginLeft: -15,
              marginTop: -29,
              alignItems: "center",
              pointerEvents: "none",
            }}
          >
            <Text
              style={{ fontSize: 40, color: "#dc3545", fontWeight: "bold" }}
            >
              📍
            </Text>
          </View>

          <View
            style={{
              position: "absolute",
              top: 50,
              left: 20,
              right: 20,
              backgroundColor: "rgba(255,255,255,0.9)",
              padding: 10,
              borderRadius: 10,
              alignItems: "center",
              elevation: 5,
            }}
          >
            <Text style={{ fontWeight: "bold", color: "#333" }}>
              Bougez la carte pour viser le lieu
            </Text>
          </View>

          <View
            style={{
              position: "absolute",
              bottom: 40,
              left: 20,
              right: 20,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <TouchableOpacity
              style={[
                styles.btnCancel,
                { backgroundColor: "white", elevation: 5 },
              ]}
              onPress={closeMapAndReopenForm}
            >
              <Text style={[styles.btnText, { color: "black" }]}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnSave, { elevation: 5 }]}
              onPress={confirmMapPick}
            >
              <Text style={styles.btnText}>Confirmer ce lieu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f8ff", paddingTop: 50 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: "#006994" },
  addButton: {
    position: "absolute",
    right: 20,
    backgroundColor: "#006994",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  addButtonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: -2,
  },
  list: { paddingHorizontal: 15 },
  logCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 15,
    marginBottom: 15,
    padding: 10,
    elevation: 2,
  },
  logImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 15,
    backgroundColor: "#eee",
  },
  logInfo: { flex: 1, justifyContent: "center" },
  logSpecies: { fontSize: 18, fontWeight: "bold", color: "#333" },
  logDetail: { fontSize: 14, color: "#666" },
  logNotes: {
    fontSize: 13,
    color: "#006994",
    fontStyle: "italic",
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: { fontSize: 18, fontWeight: "bold", color: "#888" },
  emptySubText: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 10,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    elevation: 10,
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#006994",
    marginBottom: 5,
    textAlign: "center",
  },
  photoButton: {
    width: 100,
    height: 100,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    overflow: "hidden",
  },
  photoPreview: { width: "100%", height: "100%" },
  label: { fontWeight: "bold", marginBottom: 5, color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#f9f9f9",
  },
  suggestionsBox: {
    maxHeight: 100,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 10,
    borderRadius: 5,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  oceanTag: {
    backgroundColor: "#006994",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginRight: 5,
    marginBottom: 5,
  },
  locationBtn: {
    flex: 1,
    backgroundColor: "#006994",
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: "center",
  },
  locationBtnText: { color: "white", fontSize: 12, fontWeight: "bold" },
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  btnCancel: {
    flex: 1,
    backgroundColor: "#ccc",
    padding: 12,
    borderRadius: 10,
    marginRight: 10,
    alignItems: "center",
  },
  btnDelete: {
    width: 50,
    backgroundColor: "#dc3545",
    padding: 12,
    borderRadius: 10,
    marginRight: 10,
    alignItems: "center",
  },
  btnSave: {
    flex: 1,
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 10,
    marginLeft: 10,
    alignItems: "center",
  },
  btnText: { color: "white", fontWeight: "bold" },
});
