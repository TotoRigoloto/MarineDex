// Pokédex v2 :
// - Barre de recherche par nom
// - Tri : A-Z, rareté, famille, découvertes récentes
// - Filtres : statut (tout / trouvés / manquants), famille, océan
// - Fiche enrichie : rareté en étoiles, badge famille/groupe,
//   section "Mes observations" qui montre où l'utilisateur a vu cette espèce
//   avec lien direct vers le journal
import {
  Animal,
  initialAnimals,
  Observation,
  OCEAN_NAMES,
} from "@/constants/MarineData";
import { STORAGE_KEYS } from "@/constants/Storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
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

type Sort = "az" | "rarity" | "family" | "discovered";
type Status = "ALL" | "SEEN" | "MISSING";

const SORTS: { id: Sort; label: string; icon: string }[] = [
  { id: "az", label: "A-Z", icon: "🔤" },
  { id: "rarity", label: "Rareté", icon: "✨" },
  { id: "family", label: "Famille", icon: "🐠" },
  { id: "discovered", label: "Trouvés d'abord", icon: "✅" },
];

const rarityStars = (r: number) => "⭐".repeat(r) + "☆".repeat(3 - r);

export default function PokedexScreen() {
  const [animals, setAnimals] = useState<Animal[]>(initialAnimals);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [isZooming, setIsZooming] = useState(false);

  // Filtres + recherche
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status>("ALL");
  const [oceanFilter, setOceanFilter] = useState<string>("TOUS");
  const [familyFilter, setFamilyFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("az");

  const oceanList = ["TOUS", ...Object.values(OCEAN_NAMES)];

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  const load = async () => {
    try {
      const [savedPokedex, savedLogs] = await AsyncStorage.multiGet([
        STORAGE_KEYS.POKEDEX,
        STORAGE_KEYS.LOGS,
      ]);

      // Pokedex : merge initial + saved
      if (savedPokedex[1]) {
        const loaded: Animal[] = JSON.parse(savedPokedex[1]);
        setAnimals(
          initialAnimals.map((s) => {
            const found = loaded.find(
              (a) =>
                a.name.trim().toLowerCase() === s.name.trim().toLowerCase(),
            );
            return { ...s, discovered: found?.discovered ?? false };
          }),
        );
      } else {
        setAnimals(initialAnimals);
      }

      setObservations(savedLogs[1] ? JSON.parse(savedLogs[1]) : []);
    } catch (e) {
      console.error(e);
    }
  };

  // Liste des familles présentes dans la BDD
  const availableFamilies = useMemo(
    () => [...new Set(animals.map((a) => a.family))].sort(),
    [animals],
  );

  // Pipeline filtre + tri
  const visibleAnimals = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = animals.filter((a) => {
      if (statusFilter === "SEEN" && !a.discovered) return false;
      if (statusFilter === "MISSING" && a.discovered) return false;
      if (oceanFilter !== "TOUS") {
        if (!a.habitats || !a.habitats.includes(oceanFilter)) return false;
      }
      if (familyFilter && a.family !== familyFilter) return false;
      if (q && !a.name.toLowerCase().includes(q)) return false;
      return true;
    });

    switch (sort) {
      case "az":
        list = list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "rarity":
        list = list.sort((a, b) => b.rarity - a.rarity);
        break;
      case "family":
        list = list.sort(
          (a, b) =>
            a.family.localeCompare(b.family) || a.name.localeCompare(b.name),
        );
        break;
      case "discovered":
        list = list.sort(
          (a, b) =>
            Number(b.discovered) - Number(a.discovered) ||
            a.name.localeCompare(b.name),
        );
        break;
    }
    return list;
  }, [animals, search, statusFilter, oceanFilter, familyFilter, sort]);

  const discoveredCount = animals.filter((a) => a.discovered).length;
  const progressPct = Math.round((discoveredCount / animals.length) * 100);

  // Observations personnelles pour l'espèce sélectionnée
  const ownObservations = useMemo(() => {
    if (!selectedAnimal) return [];
    return observations.filter(
      (o) =>
        o.speciesName.trim().toLowerCase() ===
        selectedAnimal.name.trim().toLowerCase(),
    );
  }, [selectedAnimal, observations]);

  const closeDetails = () => {
    setIsZooming(false);
    setSelectedAnimal(null);
  };

  const renderItem = ({ item }: { item: Animal }) => (
    <TouchableOpacity
      style={[styles.card, !item.discovered && styles.cardLocked]}
      onPress={() => setSelectedAnimal(item)}
      activeOpacity={0.85}
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
          <Text style={styles.badgeText}>{item.discovered ? "✓" : "?"}</Text>
        </View>
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {item.discovered ? item.name : "???"}
      </Text>
      <Text style={styles.rarityTxt}>{rarityStars(item.rarity)}</Text>
      <View style={styles.familyTag}>
        <Text style={styles.familyTagTxt} numberOfLines={1}>
          {item.family}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>📖 Pokédex</Text>
        <View style={styles.progressBox}>
          <Text style={styles.progressTxt}>
            {discoveredCount} / {animals.length}
          </Text>
          <View style={styles.progressBarBg}>
            <View
              style={[styles.progressBarFill, { width: `${progressPct}%` }]}
            />
          </View>
        </View>
      </View>

      {/* Recherche */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une espèce…"
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Text style={styles.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Statut + Tri */}
      <View style={styles.row}>
        {(["ALL", "SEEN", "MISSING"] as Status[]).map((s) => (
          <TouchableOpacity
            key={s}
            style={[
              styles.statusBtn,
              statusFilter === s && styles.statusBtnActive,
            ]}
            onPress={() => setStatusFilter(s)}
          >
            <Text
              style={[
                styles.statusBtnTxt,
                statusFilter === s && styles.statusBtnTxtActive,
              ]}
            >
              {s === "ALL" ? "Tout" : s === "SEEN" ? "✓ Trouvés" : "🔒 À voir"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tri */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 40, marginBottom: 6 }}
        contentContainerStyle={{
          paddingHorizontal: 12,
          gap: 6,
          alignItems: "center",
        }}
      >
        <Text style={styles.sortLabel}>Trier :</Text>
        {SORTS.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.sortChip, sort === s.id && styles.sortChipActive]}
            onPress={() => setSort(s.id)}
          >
            <Text
              style={[
                styles.sortChipTxt,
                sort === s.id && styles.sortChipTxtActive,
              ]}
            >
              {s.icon} {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Familles (Scroll horizontal fluide et stable) */}
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        directionalLockEnabled={true}
        alwaysBounceVertical={false}
        style={styles.familyChipsScroll} // On réutilise le style du container parent
        contentContainerStyle={styles.familyChips} // On applique le style de la rangée interne
      >
        <TouchableOpacity
          style={[styles.famChip, !familyFilter && styles.famChipActive]}
          onPress={() => setFamilyFilter(null)}
        >
          <Text
            style={[
              styles.famChipTxt,
              !familyFilter && styles.famChipTxtActive,
            ]}
          >
            Toutes
          </Text>
        </TouchableOpacity>
        {availableFamilies.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.famChip, familyFilter === f && styles.famChipActive]}
            onPress={() => setFamilyFilter(familyFilter === f ? null : f)}
          >
            <Text
              style={[
                styles.famChipTxt,
                familyFilter === f && styles.famChipTxtActive,
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Océans (scroll horizontal) */}
      <View style={{ height: 44 }}>
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
                {ocean === "TOUS" ? "🌍 Monde" : ocean}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {visibleAnimals.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 48 }}>🔍</Text>
          <Text style={styles.emptyTxt}>Aucune espèce ne correspond.</Text>
        </View>
      ) : (
        <FlatList
          data={visibleAnimals}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
        />
      )}

      {/* ===== MODAL ZOOM ===== */}
      {selectedAnimal && isZooming && (
        <Modal
          animationType="fade"
          transparent={false}
          visible
          onRequestClose={() => setIsZooming(false)}
        >
          <SafeAreaView style={styles.zoomBg}>
            <TouchableOpacity
              style={styles.closeZoomButton}
              onPress={() => setIsZooming(false)}
            >
              <Text style={styles.closeZoomText}>✕ Retour</Text>
            </TouchableOpacity>
            <Image
              source={selectedAnimal.image}
              style={{ width: "100%", height: "80%" }}
              resizeMode="contain"
            />
            <Text style={styles.zoomName}>{selectedAnimal.name}</Text>
          </SafeAreaView>
        </Modal>
      )}

      {/* ===== MODAL DÉTAILS ===== */}
      {selectedAnimal && !isZooming && (
        <Modal
          animationType="fade"
          transparent
          visible
          onRequestClose={closeDetails}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalView}>
              <TouchableOpacity style={styles.closeIcon} onPress={closeDetails}>
                <Text style={{ fontSize: 24, color: "#aaa" }}>✕</Text>
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableOpacity onPress={() => setIsZooming(true)}>
                  <Image
                    source={selectedAnimal.image}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.zoomHint}>(Toucher pour agrandir)</Text>
                </TouchableOpacity>

                <Text style={styles.modalTitle}>{selectedAnimal.name}</Text>
                <View style={styles.badgeRow}>
                  <Text style={styles.rarityBig}>
                    {rarityStars(selectedAnimal.rarity)}
                  </Text>
                </View>
                <View style={styles.badgeRow}>
                  <View
                    style={[styles.miniBadge, { backgroundColor: "#006994" }]}
                  >
                    <Text style={styles.miniBadgeTxt}>
                      🐠 {selectedAnimal.family}
                    </Text>
                  </View>
                  <View
                    style={[styles.miniBadge, { backgroundColor: "#0288D1" }]}
                  >
                    <Text style={styles.miniBadgeTxt}>
                      {selectedAnimal.groupe}
                    </Text>
                  </View>
                </View>

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

                <Text style={styles.sectionTitle}>Description</Text>
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
                      📍 Habitats naturels
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

                {/* ====== MES OBSERVATIONS ====== */}
                {ownObservations.length > 0 ? (
                  <View style={{ marginTop: 20 }}>
                    <Text style={styles.sectionTitle}>
                      📔 Mes observations ({ownObservations.length})
                    </Text>
                    {ownObservations.slice(0, 3).map((o) => (
                      <TouchableOpacity
                        key={o.id}
                        style={styles.ownObsRow}
                        onPress={() => {
                          closeDetails();
                          setTimeout(() => router.push("/(tabs)/logbook"), 200);
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.ownObsDate}>📅 {o.date}</Text>
                          <Text style={styles.ownObsLoc}>
                            📍 {o.location} ({o.ocean})
                          </Text>
                        </View>
                        <Text style={{ color: "#006994" }}>→</Text>
                      </TouchableOpacity>
                    ))}
                    {ownObservations.length > 3 && (
                      <Text style={styles.moreTxt}>
                        +{ownObservations.length - 3} autre(s) dans le journal…
                      </Text>
                    )}
                  </View>
                ) : (
                  selectedAnimal.discovered && (
                    <View style={styles.noObsBox}>
                      <Text style={styles.noObsTxt}>
                        Tu l&apos;as découverte mais aucune observation
                        détaillée enregistrée.
                      </Text>
                    </View>
                  )
                )}

                <View style={{ height: 20 }} />
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

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#006994",
    flex: 1,
  },
  progressBox: { width: 140, alignItems: "flex-end" },
  progressTxt: { fontSize: 12, color: "#006994", fontWeight: "bold" },
  progressBarBg: {
    width: "100%",
    height: 6,
    backgroundColor: "#e1eef5",
    borderRadius: 3,
    marginTop: 4,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", backgroundColor: "#006994" },

  // Recherche
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 2,
  },
  familyChipsScroll: { marginBottom: 12, height: 40, flexGrow: 0 },
  familyChips: {
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  searchIcon: { fontSize: 14, marginRight: 8, opacity: 0.6 },
  searchInput: { flex: 1, fontSize: 14, color: "#333", padding: 0 },
  searchClear: { fontSize: 16, color: "#999", paddingHorizontal: 6 },

  // Statut
  row: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
    gap: 8,
  },
  statusBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#006994",
  },
  statusBtnActive: { backgroundColor: "#006994" },
  statusBtnTxt: { color: "#006994", fontWeight: "bold", fontSize: 13 },
  statusBtnTxtActive: { color: "white" },

  // Tri
  sortLabel: { color: "#666", fontSize: 12, fontWeight: "600", marginRight: 4 },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  sortChipActive: { backgroundColor: "#FFB300", borderColor: "#FFB300" },
  sortChipTxt: { fontSize: 12, color: "#555", fontWeight: "600" },
  sortChipTxtActive: { color: "white" },

  // Familles wrap
  familyWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  famChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  famChipActive: { backgroundColor: "#0288D1", borderColor: "#0288D1" },
  famChipTxt: { fontSize: 11, color: "#555", fontWeight: "600" },
  famChipTxtActive: { color: "white" },

  // Océans
  oceanScroll: { paddingHorizontal: 12, alignItems: "center", gap: 6 },
  oceanChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: "#e1eef5",
    borderRadius: 18,
    height: 32,
    justifyContent: "center",
  },
  oceanChipActive: { backgroundColor: "#009688" },
  oceanText: { color: "#006994", fontSize: 12, fontWeight: "600" },
  oceanTextActive: { color: "white" },

  list: { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 60 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  emptyTxt: { fontSize: 14, color: "#888", marginTop: 8 },

  // Card
  card: {
    flex: 1,
    backgroundColor: "white",
    margin: 6,
    padding: 10,
    borderRadius: 15,
    alignItems: "center",
    elevation: 3,
  },
  cardLocked: { backgroundColor: "#f9f9f9", opacity: 0.8 },
  imageContainer: { position: "relative", marginBottom: 8 },
  image: { width: 80, height: 80 },
  imageLocked: { opacity: 0.2 },
  badge: {
    position: "absolute",
    bottom: -5,
    right: -5,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { color: "white", fontSize: 11, fontWeight: "bold" },
  name: {
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
  rarityTxt: { fontSize: 10, marginTop: 2 },
  familyTag: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
    maxWidth: "95%",
  },
  familyTagTxt: { fontSize: 9, color: "#006994", fontWeight: "600" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    width: "88%",
    maxHeight: "88%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 22,
    elevation: 5,
  },
  closeIcon: { position: "absolute", right: 15, top: 10, zIndex: 1 },
  modalImage: { width: 160, height: 160, alignSelf: "center", marginBottom: 5 },
  zoomHint: {
    textAlign: "center",
    fontSize: 10,
    color: "#aaa",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#006994",
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginVertical: 4,
    flexWrap: "wrap",
  },
  rarityBig: { fontSize: 18 },
  miniBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  miniBadgeTxt: { color: "white", fontSize: 11, fontWeight: "bold" },

  statusTag: {
    padding: 8,
    borderRadius: 8,
    marginVertical: 12,
    alignSelf: "center",
  },

  sectionTitle: {
    fontWeight: "bold",
    fontSize: 15,
    marginTop: 12,
    color: "#006994",
    marginBottom: 6,
  },
  descText: { fontStyle: "italic", color: "#444", lineHeight: 20 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    gap: 10,
  },
  infoBox: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  infoLabel: {
    fontSize: 11,
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

  // Mes observations
  ownObsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f6fbff",
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#006994",
  },
  ownObsDate: { fontWeight: "bold", color: "#333", fontSize: 13 },
  ownObsLoc: { fontSize: 12, color: "#666", marginTop: 2 },
  moreTxt: {
    textAlign: "center",
    color: "#006994",
    fontStyle: "italic",
    fontSize: 12,
    marginTop: 4,
  },
  noObsBox: {
    backgroundColor: "#fff8e1",
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  noObsTxt: { color: "#5d4037", fontSize: 12, fontStyle: "italic" },

  // Zoom
  zoomBg: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
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
  zoomName: {
    color: "white",
    marginTop: 20,
    fontSize: 18,
    fontWeight: "bold",
  },
});
