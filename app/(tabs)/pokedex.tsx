import { Animal, initialAnimals, OCEAN_NAMES } from "@/constants/MarineData";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function PokedexScreen() {
  const [animals, setAnimals] = useState<Animal[]>(initialAnimals);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);

  // NOUVEAU : État pour savoir si on est en mode "Zoom"
  const [isZooming, setIsZooming] = useState(false);

  const [statusFilter, setStatusFilter] = useState<"ALL" | "SEEN" | "MISSING">(
    "ALL",
  );
  const [oceanFilter, setOceanFilter] = useState<string>("TOUS");

  const oceanList = ["TOUS", ...Object.values(OCEAN_NAMES)];

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, []),
  );

  const loadProgress = async () => {
    try {
      const savedData = await AsyncStorage.getItem("pokedex_save");
      if (savedData !== null) {
        const loadedAnimals: Animal[] = JSON.parse(savedData);
        const mergedAnimals = initialAnimals.map((staticAnimal) => {
          const savedAnimal = loadedAnimals.find(
            (a) =>
              a.name.trim().toLowerCase() ===
              staticAnimal.name.trim().toLowerCase(),
          );
          return {
            ...staticAnimal,
            discovered: savedAnimal ? savedAnimal.discovered : false,
          };
        });
        setAnimals(mergedAnimals);
      } else {
        setAnimals(initialAnimals);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getFilteredData = () => {
    return animals.filter((animal) => {
      if (statusFilter === "SEEN" && !animal.discovered) return false;
      if (statusFilter === "MISSING" && animal.discovered) return false;
      if (oceanFilter !== "TOUS") {
        if (!animal.habitats) return false;
        if (!animal.habitats.includes(oceanFilter)) return false;
      }
      return true;
    });
  };

  // Fonction pour fermer proprement la fiche
  const closeDetails = () => {
    setIsZooming(false);
    setSelectedAnimal(null);
  };

  const renderItem = ({ item }: { item: Animal }) => (
    <TouchableOpacity
      style={[styles.card, !item.discovered && styles.cardLocked]}
      onPress={() => setSelectedAnimal(item)}
    >
      <View style={styles.imageContainer}>
        <Image
          source={item.image}
          style={[styles.image, !item.discovered && styles.imageLocked]}
        />
        <View
          style={[
            styles.badge,
            { backgroundColor: item.discovered ? "#28a745" : "#ccc" },
          ]}
        >
          <Text style={styles.badgeText}>
            {item.discovered ? "Trouvé" : "?"}
          </Text>
        </View>
      </View>
      <Text style={styles.name}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>📖 Encyclopédie</Text>

      {/* FILTRES STATUT */}
      <View style={styles.statusFilterBar}>
        <TouchableOpacity
          onPress={() => setStatusFilter("ALL")}
          style={[
            styles.filterBtn,
            statusFilter === "ALL" && styles.filterBtnActive,
          ]}
        >
          <Text
            style={[
              styles.filterText,
              statusFilter === "ALL" && styles.filterTextActive,
            ]}
          >
            Tout
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setStatusFilter("SEEN")}
          style={[
            styles.filterBtn,
            statusFilter === "SEEN" && styles.filterBtnActive,
          ]}
        >
          <Text
            style={[
              styles.filterText,
              statusFilter === "SEEN" && styles.filterTextActive,
            ]}
          >
            ✅ Trouvés
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setStatusFilter("MISSING")}
          style={[
            styles.filterBtn,
            statusFilter === "MISSING" && styles.filterBtnActive,
          ]}
        >
          <Text
            style={[
              styles.filterText,
              statusFilter === "MISSING" && styles.filterTextActive,
            ]}
          >
            🔒 Manquants
          </Text>
        </TouchableOpacity>
      </View>

      {/* FILTRE OCÉAN */}
      <View style={{ height: 50 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.oceanScroll}
        >
          {oceanList.map((ocean) => (
            <TouchableOpacity
              key={ocean}
              style={[
                styles.oceanChip,
                oceanFilter === ocean && styles.oceanChipActive,
              ]}
              onPress={() => setOceanFilter(ocean)}
            >
              <Text
                style={[
                  styles.oceanText,
                  oceanFilter === ocean && styles.oceanTextActive,
                ]}
              >
                {ocean === "TOUS" ? "🌍 Monde Entier" : ocean}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={getFilteredData()}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
      />

      {/* --- GESTION DES MODALS SANS CONFLIT --- 
        On affiche SOIT le Zoom, SOIT les Détails, jamais les deux en même temps.
      */}

      {/* 1. MODAL ZOOM (Prioritaire si isZooming est vrai) */}
      {selectedAnimal && isZooming && (
        <Modal
          animationType="fade"
          transparent={false}
          visible={true}
          onRequestClose={() => setIsZooming(false)}
        >
          <SafeAreaView
            style={{
              flex: 1,
              backgroundColor: "black",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              style={styles.closeZoomButton}
              onPress={() => setIsZooming(false)}
            >
              <Text style={styles.closeZoomText}>✕ RETOUR</Text>
            </TouchableOpacity>

            <Image
              source={selectedAnimal.image}
              style={{ width: "100%", height: "80%" }}
              resizeMode="contain"
            />

            <Text
              style={{
                color: "white",
                marginTop: 20,
                fontSize: 18,
                fontWeight: "bold",
              }}
            >
              {selectedAnimal.name}
            </Text>
          </SafeAreaView>
        </Modal>
      )}

      {/* 2. MODAL DÉTAILS (Seulement si on ne zoome pas) */}
      {selectedAnimal && !isZooming && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={true}
          onRequestClose={closeDetails}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalView}>
              <TouchableOpacity style={styles.closeIcon} onPress={closeDetails}>
                <Text style={{ fontSize: 24, color: "#aaa" }}>✕</Text>
              </TouchableOpacity>

              {/* CLIC SUR L'IMAGE LANCE LE ZOOM */}
              <TouchableOpacity onPress={() => setIsZooming(true)}>
                <Image
                  source={selectedAnimal.image}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 10,
                    color: "#aaa",
                    marginBottom: 10,
                  }}
                >
                  (Toucher pour agrandir)
                </Text>
              </TouchableOpacity>

              <Text style={styles.modalTitle}>{selectedAnimal.name}</Text>

              <View
                style={[
                  styles.statusTag,
                  {
                    backgroundColor: selectedAnimal.discovered
                      ? "#d4edda"
                      : "#f8d7da",
                  },
                ]}
              >
                <Text
                  style={{
                    color: selectedAnimal.discovered ? "#155724" : "#721c24",
                    fontWeight: "bold",
                  }}
                >
                  {selectedAnimal.discovered
                    ? "✅ Espèce observée"
                    : "🔒 Pas encore observé"}
                </Text>
              </View>

              <ScrollView style={styles.scrollInfo}>
                <Text style={styles.sectionTitle}>Description :</Text>
                <Text style={styles.descText}>
                  {selectedAnimal.description}
                </Text>

                <View style={styles.infoRow}>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>📏 Taille</Text>
                    <Text style={styles.infoValue}>{selectedAnimal.size}</Text>
                  </View>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>🌊 Profondeur</Text>
                    <Text style={styles.infoValue}>{selectedAnimal.depth}</Text>
                  </View>
                </View>

                {selectedAnimal.habitats && (
                  <View style={{ marginTop: 15 }}>
                    <Text style={styles.sectionTitle}>
                      📍 Habitats naturels :
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                      {selectedAnimal.habitats.map((ocean) => (
                        <View key={ocean} style={styles.modalOceanTag}>
                          <Text style={{ color: "white", fontSize: 12 }}>
                            {ocean}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {selectedAnimal.danger && (
                  <View
                    style={[
                      styles.infoBox,
                      {
                        marginTop: 15,
                        backgroundColor: "#fff3cd",
                        borderColor: "#ffeeba",
                      },
                    ]}
                  >
                    <Text style={[styles.infoLabel, { color: "#856404" }]}>
                      ⚠️ Dangerosité
                    </Text>
                    <Text style={{ color: "#856404", fontWeight: "bold" }}>
                      {selectedAnimal.danger}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f8ff", paddingTop: 50 },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#006994",
    textAlign: "center",
    marginBottom: 10,
  },

  statusFilterBar: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#006994",
    marginHorizontal: 5,
  },
  filterBtnActive: { backgroundColor: "#006994" },
  filterText: { color: "#006994", fontWeight: "bold" },
  filterTextActive: { color: "white" },

  oceanScroll: { paddingHorizontal: 10, alignItems: "center" },
  oceanChip: {
    paddingVertical: 6,
    paddingHorizontal: 15,
    backgroundColor: "#e1eef5",
    borderRadius: 20,
    marginRight: 8,
    height: 35,
    justifyContent: "center",
  },
  oceanChipActive: { backgroundColor: "#009688" },
  oceanText: { color: "#006994", fontSize: 13, fontWeight: "600" },
  oceanTextActive: { color: "white" },

  list: { paddingHorizontal: 10, marginTop: 10 },

  card: {
    flex: 1,
    backgroundColor: "white",
    margin: 6,
    padding: 10,
    borderRadius: 15,
    alignItems: "center",
    elevation: 3,
  },
  // Style verrouillé modifié : plus de tintColor gray !
  cardLocked: { backgroundColor: "#f9f9f9", opacity: 0.8 },
  imageContainer: { position: "relative", marginBottom: 8 },
  image: { width: 90, height: 90 },
  imageLocked: { opacity: 0.2 }, // Juste transparent, pas gris

  badge: {
    position: "absolute",
    bottom: -5,
    right: -5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: { color: "white", fontSize: 10, fontWeight: "bold" },
  name: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    width: "85%",
    maxHeight: "85%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    elevation: 5,
  },
  closeIcon: { position: "absolute", right: 15, top: 10, zIndex: 1 },
  modalImage: { width: 150, height: 150, alignSelf: "center", marginBottom: 5 },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#006994",
  },
  statusTag: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 15,
    alignSelf: "center",
  },
  scrollInfo: { marginBottom: 15 },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginTop: 10,
    color: "#006994",
    marginBottom: 5,
  },
  descText: { fontStyle: "italic", color: "#444", lineHeight: 20 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  infoBox: {
    flex: 0.48,
    backgroundColor: "#f8f9fa",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  infoLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  infoValue: { fontWeight: "bold", color: "#333" },
  modalOceanTag: {
    backgroundColor: "#009688",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 5,
    marginBottom: 5,
  },

  // Nouveaux styles pour le Zoom
  closeZoomButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
  },
  closeZoomText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
