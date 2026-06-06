// Pokédex v3 :
// - Recherche + tri compact (icônes) toujours visibles
// - FAB "Filtres" avec badge compteur → bottom sheet animé
// - Bottom sheet : statut, famille, océan (chips)
// - Cards visuelles : image grande, silhouette pour non-découverts
// - Compteur filtré "X / Y espèces"
import {
  Animal,
  initialAnimals,
  Observation,
  OCEAN_NAMES,
} from "@/constants/MarineData";
import { STORAGE_KEYS } from "@/constants/Storage";
import SpeciesImage from "@/components/species-image";
import * as H from "@/services/haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
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

const SORTS: { id: Sort; icon: string; label: string }[] = [
  { id: "az", icon: "🔤", label: "A-Z" },
  { id: "rarity", icon: "✨", label: "Rareté" },
  { id: "family", icon: "🐠", label: "Famille" },
  { id: "discovered", icon: "✅", label: "Trouvés d'abord" },
];

const STATUS_OPTIONS: { id: Status; label: string }[] = [
  { id: "ALL", label: "Tout" },
  { id: "SEEN", label: "✓ Trouvés" },
  { id: "MISSING", label: "🔒 À voir" },
];

const SCREEN_HEIGHT = Dimensions.get("window").height;
const rarityStars = (r: number) => "⭐".repeat(r) + "☆".repeat(3 - r);

export default function PokedexScreen() {
  // === Deep-link : filtre famille depuis la carte ===
  const params = useLocalSearchParams<{ family?: string }>();

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

  // Bottom sheet
  const [showFilters, setShowFilters] = useState(false);
  const sheetAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

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

  // === Bottom sheet animations ===
  const openFilterSheet = useCallback(() => {
    setShowFilters(true);
    H.tapLight();
    Animated.spring(sheetAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 150,
    }).start();
  }, [sheetAnim]);

  // Pré-application du filtre famille depuis la carte
  useEffect(() => {
    if (params.family) {
      setFamilyFilter(params.family);
      openFilterSheet();
    }
  }, [params.family, openFilterSheet]);

  const closeFilterSheet = useCallback(() => {
    Animated.timing(sheetAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setShowFilters(false));
  }, [sheetAnim]);

  const resetFilters = useCallback(() => {
    setStatusFilter("ALL");
    setFamilyFilter(null);
    setOceanFilter("TOUS");
    H.tapMedium();
  }, []);

  // Liste des familles présentes dans la BDD
  const availableFamilies = useMemo(
    () => [...new Set(animals.map((a) => a.family))].sort(),
    [animals],
  );

  // Nombre de filtres actifs (hors recherche et tri)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "ALL") count++;
    if (familyFilter) count++;
    if (oceanFilter !== "TOUS") count++;
    return count;
  }, [statusFilter, familyFilter, oceanFilter]);

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

  // === RENDER ITEM (card pokédex) ===
  const renderItem = useCallback(
    ({ item }: { item: Animal }) => (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          H.tapLight();
          setSelectedAnimal(item);
        }}
        activeOpacity={0.85}
      >
        <View style={styles.imageContainer}>
          <SpeciesImage
            name={item.name}
            localImage={item.image}
            style={[styles.image, !item.discovered && styles.imageLocked]}
            contentFit="contain"
          />
          <View
            style={[
              styles.statusDot,
              { backgroundColor: item.discovered ? "#43A047" : "#bbb" },
            ]}
          >
            <Text style={styles.statusDotTxt}>
              {item.discovered ? "✓" : "?"}
            </Text>
          </View>
        </View>
        <Text style={styles.cardName} numberOfLines={1}>
          {item.discovered ? item.name : "???"}
        </Text>
        <Text style={styles.cardRarity}>{rarityStars(item.rarity)}</Text>
      </TouchableOpacity>
    ),
    [],
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* === HEADER === */}
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

      {/* === RECHERCHE === */}
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

      {/* === TRI COMPACT (icônes seules) === */}
      <View style={styles.sortRow}>
        {SORTS.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.sortChip, sort === s.id && styles.sortChipActive]}
            onPress={() => {
              setSort(s.id);
              H.selection();
            }}
          >
            <Text style={styles.sortChipIcon}>{s.icon}</Text>
          </TouchableOpacity>
        ))}
        {/* Compteur filtré */}
        <View style={styles.countBox}>
          <Text style={styles.countTxt}>
            {visibleAnimals.length} / {animals.length}
          </Text>
        </View>
      </View>

      {/* === LISTE === */}
      {visibleAnimals.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 48 }}>🔍</Text>
          <Text style={styles.emptyTxt}>Aucune espèce ne correspond.</Text>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => {
              resetFilters();
              setSearch("");
            }}
          >
            <Text style={styles.resetBtnTxt}>Réinitialiser</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={visibleAnimals}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.list}
        />
      )}

      {/* === FAB FILTRES === */}
      <TouchableOpacity
        style={styles.fab}
        onPress={openFilterSheet}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>⚙️</Text>
        <Text style={styles.fabLabel}>Filtres</Text>
        {activeFilterCount > 0 && (
          <View style={styles.fabBadge}>
            <Text style={styles.fabBadgeTxt}>{activeFilterCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* === BOTTOM SHEET FILTRES === */}
      {showFilters && (
        <Modal transparent visible animationType="none" onRequestClose={closeFilterSheet}>
          <TouchableOpacity
            style={styles.sheetOverlay}
            activeOpacity={1}
            onPress={closeFilterSheet}
          >
            <Animated.View
              style={[
                styles.sheetContainer,
                { transform: [{ translateY: sheetAnim }] },
              ]}
            >
              <TouchableOpacity activeOpacity={1}>
                {/* Poignée */}
                <View style={styles.sheetHandle} />

                <Text style={styles.sheetTitle}>Filtres</Text>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={{ maxHeight: SCREEN_HEIGHT * 0.55 }}
                >
                  {/* Statut */}
                  <Text style={styles.sheetSectionTitle}>Statut</Text>
                  <View style={styles.chipsRow}>
                    {STATUS_OPTIONS.map((s) => (
                      <TouchableOpacity
                        key={s.id}
                        style={[
                          styles.filterChip,
                          statusFilter === s.id && styles.filterChipActive,
                        ]}
                        onPress={() => {
                          setStatusFilter(s.id);
                          H.selection();
                        }}
                      >
                        <Text
                          style={[
                            styles.filterChipTxt,
                            statusFilter === s.id && styles.filterChipTxtActive,
                          ]}
                        >
                          {s.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Famille */}
                  <Text style={styles.sheetSectionTitle}>Famille</Text>
                  <View style={styles.chipsWrap}>
                    <TouchableOpacity
                      style={[
                        styles.filterChip,
                        !familyFilter && styles.filterChipActive,
                      ]}
                      onPress={() => {
                        setFamilyFilter(null);
                        H.selection();
                      }}
                    >
                      <Text
                        style={[
                          styles.filterChipTxt,
                          !familyFilter && styles.filterChipTxtActive,
                        ]}
                      >
                        Toutes
                      </Text>
                    </TouchableOpacity>
                    {availableFamilies.map((f) => (
                      <TouchableOpacity
                        key={f}
                        style={[
                          styles.filterChip,
                          familyFilter === f && styles.filterChipActive,
                        ]}
                        onPress={() => {
                          setFamilyFilter(familyFilter === f ? null : f);
                          H.selection();
                        }}
                      >
                        <Text
                          style={[
                            styles.filterChipTxt,
                            familyFilter === f && styles.filterChipTxtActive,
                          ]}
                        >
                          {f}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Océan */}
                  <Text style={styles.sheetSectionTitle}>Océan</Text>
                  <View style={styles.chipsWrap}>
                    {oceanList.map((ocean) => (
                      <TouchableOpacity
                        key={ocean}
                        style={[
                          styles.filterChip,
                          oceanFilter === ocean && styles.filterChipActive,
                        ]}
                        onPress={() => {
                          setOceanFilter(ocean);
                          H.selection();
                        }}
                      >
                        <Text
                          style={[
                            styles.filterChipTxt,
                            oceanFilter === ocean && styles.filterChipTxtActive,
                          ]}
                        >
                          {ocean === "TOUS" ? "🌍 Monde" : ocean}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={{ height: 16 }} />
                </ScrollView>

                {/* Actions */}
                <View style={styles.sheetActions}>
                  <TouchableOpacity
                    style={styles.sheetResetBtn}
                    onPress={resetFilters}
                  >
                    <Text style={styles.sheetResetTxt}>Réinitialiser</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sheetApplyBtn}
                    onPress={() => {
                      H.tapMedium();
                      closeFilterSheet();
                    }}
                  >
                    <Text style={styles.sheetApplyTxt}>
                      Appliquer ({visibleAnimals.length})
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </Modal>
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
            <SpeciesImage
              name={selectedAnimal.name}
              localImage={selectedAnimal.image}
              style={{ width: "100%", height: "80%" }}
              contentFit="contain"
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
                  <SpeciesImage
                    name={selectedAnimal.name}
                    localImage={selectedAnimal.image}
                    style={styles.modalImage}
                    contentFit="contain"
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
  searchIcon: { fontSize: 14, marginRight: 8, opacity: 0.6 },
  searchInput: { flex: 1, fontSize: 14, color: "#333", padding: 0 },
  searchClear: { fontSize: 16, color: "#999", paddingHorizontal: 6 },

  // Tri compact
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 6,
  },
  sortChip: {
    width: 40,
    height: 36,
    borderRadius: 12,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  sortChipActive: { backgroundColor: "#FFB300", borderColor: "#FFB300" },
  sortChipIcon: { fontSize: 16 },
  countBox: {
    marginLeft: "auto",
    backgroundColor: "#e1eef5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  countTxt: { fontSize: 12, color: "#006994", fontWeight: "bold" },

  // Liste
  list: { paddingHorizontal: 8, paddingTop: 4, paddingBottom: 80 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  emptyTxt: { fontSize: 14, color: "#888", marginTop: 8 },
  resetBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#006994",
  },
  resetBtnTxt: { color: "white", fontWeight: "bold", fontSize: 13 },

  // Card (3 colonnes, plus compact et visuel)
  card: {
    flex: 1,
    backgroundColor: "white",
    margin: 4,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 16,
    alignItems: "center",
    elevation: 2,
    maxWidth: "33%",
  },
  imageContainer: { position: "relative", marginBottom: 6 },
  image: { width: 72, height: 72 },
  imageLocked: { opacity: 0.3 },
  statusDot: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  statusDotTxt: { color: "white", fontSize: 10, fontWeight: "bold" },
  cardName: {
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginTop: 2,
  },
  cardRarity: { fontSize: 9, marginTop: 2 },

  // FAB
  fab: {
    position: "absolute",
    bottom: 90,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#006994",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    gap: 6,
  },
  fabIcon: { fontSize: 16 },
  fabLabel: { color: "white", fontWeight: "bold", fontSize: 14 },
  fabBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#FF6F00",
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  fabBadgeTxt: { color: "white", fontSize: 11, fontWeight: "bold" },

  // Bottom sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#ddd",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#006994",
    marginBottom: 16,
  },
  sheetSectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    marginTop: 12,
  },
  chipsRow: { flexDirection: "row", gap: 8 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#f0f4f8",
    borderWidth: 1,
    borderColor: "#e0e4e8",
  },
  filterChipActive: {
    backgroundColor: "#006994",
    borderColor: "#006994",
  },
  filterChipTxt: { fontSize: 13, color: "#555", fontWeight: "600" },
  filterChipTxtActive: { color: "white" },
  sheetActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  sheetResetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#006994",
    alignItems: "center",
  },
  sheetResetTxt: { color: "#006994", fontWeight: "bold", fontSize: 14 },
  sheetApplyBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#006994",
    alignItems: "center",
  },
  sheetApplyTxt: { color: "white", fontWeight: "bold", fontSize: 14 },

  // Modal détails (inchangé)
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
  modalImage: {
    width: 220,
    height: 220,
    alignSelf: "center",
    marginBottom: 5,
  },
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
