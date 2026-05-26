// Journal de Bord avec deux modes :
//   • Voyages (storyboards) : regroupe les observations par voyage
//   • Observations : la liste classique
// Chaque observation peut être rattachée à un voyage (tripId).
// Cliquer sur un voyage → ouvre /trip/[id]
// Cliquer sur une observation → ouvre le modal d'édition

import {
  Animal,
  ENCYCLOPEDIA_DATA,
  GEOGRAPHY_DB,
  initialAnimals,
  Observation,
  Trip,
  TRIP_COLORS,
} from "@/constants/MarineData";
import { STORAGE_KEYS } from "@/constants/Storage";
import { deleteObsCloud } from "@/services/sync";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import MapView from "react-native-maps";

type Mode = "trips" | "observations";

export default function LogbookScreen() {
  const [logs, setLogs] = useState<Observation[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [mode, setMode] = useState<Mode>("trips");

  // États formulaire observation
  const [formVisible, setFormVisible] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
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
  const [obsTripId, setObsTripId] = useState<string | undefined>(undefined);
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

  // Recherche & filtres journal
  const [search, setSearch] = useState("");
  const [familyFilter, setFamilyFilter] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // États formulaire voyage
  const [tripFormVisible, setTripFormVisible] = useState(false);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [tripName, setTripName] = useState("");
  const [tripCountry, setTripCountry] = useState("");
  const [tripStart, setTripStart] = useState("");
  const [tripEnd, setTripEnd] = useState("");
  const [tripCover, setTripCover] = useState<string | undefined>(undefined);
  const [tripNotes, setTripNotes] = useState("");
  const [tripColor, setTripColor] = useState(TRIP_COLORS[0]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, []),
  );

  const loadAll = async () => {
    try {
      const [savedLogs, savedTrips] = await AsyncStorage.multiGet([
        STORAGE_KEYS.LOGS,
        STORAGE_KEYS.TRIPS,
      ]);
      setLogs(savedLogs[1] ? JSON.parse(savedLogs[1]) : []);
      setTrips(savedTrips[1] ? JSON.parse(savedTrips[1]) : []);
    } catch (e) {
      console.error(e);
    }
  };

  // Familles disponibles dans les observations courantes
  const availableFamilies = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      const f = ENCYCLOPEDIA_DATA[l.speciesName]?.family;
      if (f) set.add(f);
    });
    return [...set].sort();
  }, [logs]);

  // Liste filtrée + triée pour l'affichage
  const visibleLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((l) => {
      if (familyFilter) {
        const f = ENCYCLOPEDIA_DATA[l.speciesName]?.family;
        if (f !== familyFilter) return false;
      }
      if (q) {
        const hay =
          `${l.speciesName} ${l.location} ${l.notes ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [logs, search, familyFilter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, []);

  // Statistiques par voyage (mémorisées pour ne pas recalculer à chaque render)
  const tripStats = useMemo(() => {
    const map: Record<
      string,
      { count: number; species: number; lastDate: string }
    > = {};
    trips.forEach((t) => {
      const obs = logs.filter((l) => l.tripId === t.id);
      const uniq = new Set(obs.map((o) => o.speciesName));
      map[t.id] = {
        count: obs.length,
        species: uniq.size,
        lastDate: obs[0]?.date ?? t.startDate,
      };
    });
    return map;
  }, [trips, logs]);

  // ====== GPS et carte ======
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

  const openMapPicker = () => {
    setFormVisible(false);
    setTimeout(() => setMapVisible(true), 300);
  };
  const confirmMapPick = () => {
    setExactCoords({
      latitude: pickerRegion.latitude,
      longitude: pickerRegion.longitude,
    });
    closeMapAndReopenForm();
  };
  const closeMapAndReopenForm = () => {
    setMapVisible(false);
    setTimeout(() => setFormVisible(true), 300);
  };

  // ====== Observation form ======
  const openNewLogModal = (tripId?: string) => {
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
    setObsTripId(tripId);
    // Si on crée depuis un voyage, pré-remplir le pays
    if (tripId) {
      const t = trips.find((tt) => tt.id === tripId);
      if (t) setLocationInput(t.country);
    }
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
    setObsTripId(item.tripId);
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

  const handleSpeciesChange = (text: string) => {
    setSpeciesInput(text);
    if (text.length > 0) {
      const sug = Object.keys(ENCYCLOPEDIA_DATA).filter((s) =>
        s.toLowerCase().includes(text.toLowerCase()),
      );
      setFilteredSpecies(sug);
    } else {
      setFilteredSpecies([]);
    }
  };
  const pickSpecies = (n: string) => {
    setSpeciesInput(n);
    setFilteredSpecies([]);
  };
  const handleLocationChange = (text: string) => {
    setLocationInput(text);
    if (text.length > 1) {
      const all = Object.keys(GEOGRAPHY_DB);
      setFilteredLocations(
        all.filter((c) => c.toLowerCase().includes(text.toLowerCase())),
      );
    } else {
      setFilteredLocations([]);
    }
  };
  const pickLocation = (c: string) => {
    setLocationInput(c);
    setFilteredLocations([]);
    checkOcean(c);
  };
  const checkOcean = (countryName: string) => {
    const key = Object.keys(GEOGRAPHY_DB).find(
      (k) => k.toLowerCase() === countryName.trim().toLowerCase(),
    );
    if (key) {
      setLocationInput(key);
      const oceans = GEOGRAPHY_DB[key];
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

  const saveLog = async () => {
    if (!speciesInput.trim()) {
      Alert.alert("Erreur", "Nom d'espèce obligatoire !");
      return;
    }
    const data: Observation = {
      id: editingLogId || Date.now().toString(),
      speciesName: speciesInput,
      date: dateInput,
      location: locationInput || "Inconnu",
      ocean: oceanInput || "Non précisé",
      notes: notesInput,
      userPhoto: selectedPhoto,
      latitude: exactCoords?.latitude,
      longitude: exactCoords?.longitude,
      tripId: obsTripId,
    };
    try {
      let updated;
      if (editingLogId) {
        updated = logs.map((l) => (l.id === editingLogId ? data : l));
      } else {
        updated = [data, ...logs];
        await checkPokedexUnlock(speciesInput);
      }
      setLogs(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updated));
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
          const updated = logs.filter((l) => l.id !== editingLogId);
          setLogs(updated);
          await AsyncStorage.setItem(
            STORAGE_KEYS.LOGS,
            JSON.stringify(updated),
          );
          setFormVisible(false);
        },
      },
    ]);
  };

  const checkPokedexUnlock = async (name: string) => {
    const saved = await AsyncStorage.getItem(STORAGE_KEYS.POKEDEX);
    const savedAnimals: Animal[] = saved ? JSON.parse(saved) : [];
    const updated = initialAnimals.map((a) => {
      const prev = savedAnimals.find(
        (x) => x.name.trim().toLowerCase() === a.name.trim().toLowerCase(),
      );
      const isNew = a.name.trim().toLowerCase() === name.trim().toLowerCase();
      return {
        ...a,
        discovered: isNew || (prev ? prev.discovered : false),
      };
    });
    if (
      updated.some(
        (a) => a.name.trim().toLowerCase() === name.trim().toLowerCase(),
      )
    )
      await AsyncStorage.setItem(STORAGE_KEYS.POKEDEX, JSON.stringify(updated));
  };

  // ====== Trips form ======
  const openNewTripModal = () => {
    setEditingTripId(null);
    setTripName("");
    setTripCountry("");
    setTripStart("");
    setTripEnd("");
    setTripCover(undefined);
    setTripNotes("");
    setTripColor(TRIP_COLORS[0]);
    setTripFormVisible(true);
  };

  const openEditTripModal = (t: Trip) => {
    setEditingTripId(t.id);
    setTripName(t.name);
    setTripCountry(t.country);
    setTripStart(t.startDate);
    setTripEnd(t.endDate);
    setTripCover(t.coverPhoto);
    setTripNotes(t.notes ?? "");
    setTripColor(t.color);
    setTripFormVisible(true);
  };

  const pickTripCover = async () => {
    let r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });
    if (!r.canceled) setTripCover(r.assets[0].uri);
  };

  const saveTrip = async () => {
    if (!tripName.trim()) {
      Alert.alert("Erreur", "Donne un nom à ton voyage !");
      return;
    }
    const t: Trip = {
      id: editingTripId || Date.now().toString(),
      name: tripName.trim(),
      country: tripCountry.trim() || "—",
      startDate: tripStart || new Date().toLocaleDateString(),
      endDate: tripEnd || tripStart || new Date().toLocaleDateString(),
      coverPhoto: tripCover,
      color: tripColor,
      notes: tripNotes,
      createdAt: editingTripId
        ? (trips.find((tt) => tt.id === editingTripId)?.createdAt ?? Date.now())
        : Date.now(),
    };
    const updated = editingTripId
      ? trips.map((x) => (x.id === editingTripId ? t : x))
      : [t, ...trips];
    setTrips(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(updated));
    setTripFormVisible(false);
  };

  // ====== Renderers ======
  const renderTripCard = ({ item }: { item: Trip }) => {
    const stats = tripStats[item.id] ?? { count: 0, species: 0, lastDate: "" };
    return (
      <TouchableOpacity
        style={[styles.tripCard, { borderLeftColor: item.color }]}
        onPress={() => router.push(`/trip/${item.id}` as any)}
        onLongPress={() => openEditTripModal(item)}
        activeOpacity={0.85}
      >
        <View style={styles.tripCover}>
          {item.coverPhoto ? (
            <Image
              source={{ uri: item.coverPhoto }}
              style={styles.tripCoverImg}
            />
          ) : (
            <View
              style={[styles.tripCoverImg, { backgroundColor: item.color }]}
            >
              <Text style={{ fontSize: 48 }}>🌊</Text>
            </View>
          )}
          <View style={styles.tripOverlay} />
          <View style={styles.tripCoverContent}>
            <Text style={styles.tripCardName}>{item.name}</Text>
            <Text style={styles.tripCardCountry}>📍 {item.country}</Text>
          </View>
        </View>
        <View style={styles.tripCardMeta}>
          <View style={styles.tripStat}>
            <Text style={styles.tripStatNum}>{stats.count}</Text>
            <Text style={styles.tripStatLabel}>observations</Text>
          </View>
          <View style={styles.tripStat}>
            <Text style={styles.tripStatNum}>{stats.species}</Text>
            <Text style={styles.tripStatLabel}>espèces</Text>
          </View>
          <View style={[styles.tripStat, { flex: 1.5 }]}>
            <Text style={styles.tripStatLabel}>📅</Text>
            <Text style={styles.tripDates} numberOfLines={1}>
              {item.startDate} → {item.endDate}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Swipe-to-delete : action rouge à droite
  const renderRightActions = (id: string) => (
    <TouchableOpacity
      style={styles.swipeDelete}
      onPress={() => quickDeleteObs(id)}
    >
      <Text style={styles.swipeDeleteTxt}>🗑️{"\n"}Suppr.</Text>
    </TouchableOpacity>
  );

  const quickDeleteObs = (id: string) => {
    Alert.alert("Supprimer", "Supprimer cette observation ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          const updated = logs.filter((l) => l.id !== id);
          setLogs(updated);
          await AsyncStorage.setItem(
            STORAGE_KEYS.LOGS,
            JSON.stringify(updated),
          );
          // Best-effort cloud
          deleteObsCloud(id).catch(() => {});
        },
      },
    ]);
  };

  const renderLogItem = ({ item }: { item: Observation }) => {
    const ency = ENCYCLOPEDIA_DATA[item.speciesName];
    let img;
    if (item.userPhoto) img = { uri: item.userPhoto };
    else if (ency) img = ency.image;

    const trip = item.tripId ? trips.find((t) => t.id === item.tripId) : null;

    return (
      <Swipeable renderRightActions={() => renderRightActions(item.id)}>
        <TouchableOpacity
          onPress={() => openEditLogModal(item)}
          activeOpacity={0.7}
        >
          <View style={styles.logCard}>
            {img ? (
              <Image source={img} style={styles.logImage} />
            ) : (
              <View style={[styles.logImage, styles.imgFallback]}>
                <Text style={{ fontSize: 20 }}>?</Text>
              </View>
            )}
            <View style={styles.logInfo}>
              <Text style={styles.logSpecies}>{item.speciesName}</Text>
              <Text style={styles.logDetail}>📅 {item.date}</Text>
              <Text style={styles.logDetail}>
                📍 {item.location} ({item.ocean})
              </Text>
              {trip && (
                <View
                  style={[styles.tripBadge, { backgroundColor: trip.color }]}
                >
                  <Text style={styles.tripBadgeTxt} numberOfLines={1}>
                    🧳 {trip.name}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.editPen}>✏️</Text>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  // ====== Rendu principal ======
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>📔 Journal</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            mode === "trips" ? openNewTripModal() : openNewLogModal()
          }
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Toggle Voyages / Observations */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, mode === "trips" && styles.tabBtnActive]}
          onPress={() => setMode("trips")}
        >
          <Text
            style={[
              styles.tabBtnTxt,
              mode === "trips" && styles.tabBtnTxtActive,
            ]}
          >
            🧳 Voyages ({trips.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            mode === "observations" && styles.tabBtnActive,
          ]}
          onPress={() => setMode("observations")}
        >
          <Text
            style={[
              styles.tabBtnTxt,
              mode === "observations" && styles.tabBtnTxtActive,
            ]}
          >
            🐠 Observations ({logs.length})
          </Text>
        </TouchableOpacity>
      </View>

      {mode === "trips" ? (
        trips.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 64 }}>🧳</Text>
            <Text style={styles.emptyText}>
              Aucun voyage pour l&apos;instant
            </Text>
            <Text style={styles.emptySubText}>
              Crée ton premier storyboard{"\n"}(ex: &laquo;&nbsp;Mon voyage aux
              Philippines&nbsp;&raquo;)
            </Text>
            <TouchableOpacity style={styles.ctaBtn} onPress={openNewTripModal}>
              <Text style={styles.ctaBtnTxt}>+ Nouveau voyage</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={trips}
            renderItem={renderTripCard}
            keyExtractor={(t) => t.id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#006994"]}
                tintColor="#006994"
              />
            }
          />
        )
      ) : logs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 64 }}>🐠</Text>
          <Text style={styles.emptyText}>Ton carnet est vide</Text>
          <Text style={styles.emptySubText}>Ajoute une observation (+)</Text>
        </View>
      ) : (
        <>
          {/* Barre de recherche */}
          <View style={styles.searchWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une espèce, un lieu…"
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")} hitSlop={10}>
                <Text style={styles.searchClear}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Chips de familles */}
          {availableFamilies.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.familyChips}
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
                  style={[
                    styles.famChip,
                    familyFilter === f && styles.famChipActive,
                  ]}
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
          )}

          {visibleLogs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 48 }}>🔍</Text>
              <Text style={styles.emptyText}>Aucun résultat</Text>
              <Text style={styles.emptySubText}>
                Essaie d&apos;ajuster ta recherche ou tes filtres
              </Text>
            </View>
          ) : (
            <FlatList
              data={visibleLogs}
              renderItem={renderLogItem}
              keyExtractor={(l) => l.id}
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={["#006994"]}
                  tintColor="#006994"
                />
              }
            />
          )}
        </>
      )}

      {/* ============ MODAL FORMULAIRE VOYAGE ============ */}
      <Modal visible={tripFormVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView keyboardShouldPersistTaps="handled">
                <Text style={styles.modalTitle}>
                  {editingTripId ? "Modifier le voyage" : "Nouveau voyage"}
                </Text>

                {/* Couverture */}
                <TouchableOpacity
                  style={styles.coverPicker}
                  onPress={pickTripCover}
                >
                  {tripCover ? (
                    <Image
                      source={{ uri: tripCover }}
                      style={styles.coverImg}
                    />
                  ) : (
                    <View
                      style={[styles.coverImg, { backgroundColor: tripColor }]}
                    >
                      <Text style={{ fontSize: 40 }}>📸</Text>
                      <Text style={{ color: "white", marginTop: 5 }}>
                        Photo de couverture
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <Text style={styles.label}>Nom du voyage *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Mon voyage aux Philippines"
                  value={tripName}
                  onChangeText={setTripName}
                />

                <Text style={styles.label}>Pays / Destination</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Philippines"
                  value={tripCountry}
                  onChangeText={setTripCountry}
                />

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Du</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="12/03/2025"
                      value={tripStart}
                      onChangeText={setTripStart}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Au</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="25/03/2025"
                      value={tripEnd}
                      onChangeText={setTripEnd}
                    />
                  </View>
                </View>

                <Text style={styles.label}>Couleur</Text>
                <View style={styles.colorRow}>
                  {TRIP_COLORS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setTripColor(c)}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: c },
                        tripColor === c && styles.colorSwatchActive,
                      ]}
                    />
                  ))}
                </View>

                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, { height: 80 }]}
                  multiline
                  placeholder="Anecdotes, plongées marquantes…"
                  value={tripNotes}
                  onChangeText={setTripNotes}
                />

                <View style={styles.btnRow}>
                  {editingTripId && (
                    <TouchableOpacity
                      style={styles.btnDelete}
                      onPress={() => {
                        Alert.alert(
                          "Supprimer ce voyage ?",
                          "Les observations ne seront pas supprimées, juste détachées.",
                          [
                            { text: "Annuler", style: "cancel" },
                            {
                              text: "Supprimer",
                              style: "destructive",
                              onPress: async () => {
                                const updatedTrips = trips.filter(
                                  (t) => t.id !== editingTripId,
                                );
                                const detached = logs.map((l) =>
                                  l.tripId === editingTripId
                                    ? { ...l, tripId: undefined }
                                    : l,
                                );
                                setTrips(updatedTrips);
                                setLogs(detached);
                                await AsyncStorage.multiSet([
                                  [
                                    STORAGE_KEYS.TRIPS,
                                    JSON.stringify(updatedTrips),
                                  ],
                                  [STORAGE_KEYS.LOGS, JSON.stringify(detached)],
                                ]);
                                setTripFormVisible(false);
                              },
                            },
                          ],
                        );
                      }}
                    >
                      <Text style={styles.btnText}>🗑️</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.btnCancel}
                    onPress={() => setTripFormVisible(false)}
                  >
                    <Text style={styles.btnText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnSave} onPress={saveTrip}>
                    <Text style={styles.btnText}>
                      {editingTripId ? "Mettre à jour" : "Créer"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ============ MODAL FORMULAIRE OBSERVATION ============ */}
      <Modal visible={formVisible} animationType="slide" transparent>
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

                {/* Rattacher à un voyage */}
                <Text style={styles.label}>Rattacher à un voyage :</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 12 }}
                >
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
                  <Text style={styles.gpsOk}>
                    ✅ Coordonnées GPS enregistrées
                  </Text>
                ) : (
                  <Text style={styles.gpsKo}>
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

      {/* ============ MODAL MAP PICKER ============ */}
      <Modal visible={mapVisible} animationType="slide">
        <View style={{ flex: 1 }}>
          <MapView
            style={{ flex: 1 }}
            region={pickerRegion}
            onRegionChangeComplete={(region) => setPickerRegion(region)}
          />
          <View style={styles.mapCrosshair}>
            <Text
              style={{ fontSize: 40, color: "#dc3545", fontWeight: "bold" }}
            >
              📍
            </Text>
          </View>
          <View style={styles.mapHint}>
            <Text style={{ fontWeight: "bold", color: "#333" }}>
              Bougez la carte pour viser le lieu
            </Text>
          </View>
          <View style={styles.mapActions}>
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
    marginBottom: 12,
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

  tabBar: {
    flexDirection: "row",
    marginHorizontal: 15,
    backgroundColor: "white",
    borderRadius: 25,
    padding: 4,
    marginBottom: 15,
    elevation: 2,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 22,
    alignItems: "center",
  },
  tabBtnActive: { backgroundColor: "#006994" },
  tabBtnTxt: { color: "#006994", fontWeight: "600", fontSize: 13 },
  tabBtnTxtActive: { color: "white" },

  list: { paddingHorizontal: 15, paddingBottom: 60 },

  // Recherche & filtres
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 15,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 2,
  },
  searchIcon: { fontSize: 16, marginRight: 8, opacity: 0.6 },
  searchInput: { flex: 1, fontSize: 14, color: "#333", padding: 0 },
  searchClear: { fontSize: 18, color: "#999", paddingHorizontal: 6 },
  familyChips: {
    paddingHorizontal: 15,
    paddingBottom: 10,
    gap: 6,
    flexDirection: "row",
  },
  famChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "white",
    marginRight: 6,
  },
  famChipActive: { backgroundColor: "#006994", borderColor: "#006994" },
  famChipTxt: { fontSize: 12, color: "#444", fontWeight: "600" },
  famChipTxtActive: { color: "white" },

  // Swipe delete
  swipeDelete: {
    width: 80,
    backgroundColor: "#dc3545",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderRadius: 15,
    marginLeft: 8,
  },
  swipeDeleteTxt: {
    color: "white",
    fontWeight: "bold",
    fontSize: 11,
    textAlign: "center",
  },

  // Trip card
  tripCard: {
    backgroundColor: "white",
    borderRadius: 18,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 4,
    borderLeftWidth: 6,
  },
  tripCover: { width: "100%", height: 150, position: "relative" },
  tripCoverImg: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  tripOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  tripCoverContent: { position: "absolute", bottom: 12, left: 14, right: 14 },
  tripCardName: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 4,
  },
  tripCardCountry: { color: "rgba(255,255,255,0.9)", marginTop: 4 },
  tripCardMeta: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
  },
  tripStat: { alignItems: "center", flex: 1 },
  tripStatNum: { fontSize: 20, fontWeight: "bold", color: "#006994" },
  tripStatLabel: { fontSize: 11, color: "#888" },
  tripDates: { fontSize: 11, color: "#444", marginTop: 2 },

  // Log card
  logCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 15,
    marginBottom: 12,
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
  imgFallback: { justifyContent: "center", alignItems: "center" },
  logInfo: { flex: 1, justifyContent: "center" },
  logSpecies: { fontSize: 17, fontWeight: "bold", color: "#333" },
  logDetail: { fontSize: 13, color: "#666" },
  editPen: {
    position: "absolute",
    top: 10,
    right: 10,
    fontSize: 14,
    opacity: 0.5,
  },
  tripBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
  },
  tripBadgeTxt: { color: "white", fontSize: 11, fontWeight: "bold" },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: { fontSize: 18, fontWeight: "bold", color: "#666", marginTop: 16 },
  emptySubText: {
    fontSize: 14,
    color: "#888",
    marginTop: 8,
    textAlign: "center",
  },
  ctaBtn: {
    marginTop: 24,
    backgroundColor: "#006994",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 4,
  },
  ctaBtnTxt: { color: "white", fontWeight: "bold" },

  // Modals
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
    marginBottom: 10,
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
  coverPicker: {
    width: "100%",
    height: 130,
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 10,
  },
  coverImg: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  label: { fontWeight: "bold", marginBottom: 5, color: "#333", marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
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
  gpsOk: {
    textAlign: "center",
    color: "green",
    fontSize: 12,
    marginBottom: 10,
  },
  gpsKo: {
    textAlign: "center",
    color: "#888",
    fontSize: 12,
    marginBottom: 10,
    fontStyle: "italic",
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorSwatchActive: { borderColor: "#333" },
  tripChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 8,
    backgroundColor: "white",
  },
  tripChipActive: { backgroundColor: "#006994", borderColor: "#006994" },
  tripChipTxt: { color: "#333", fontSize: 12, fontWeight: "600" },

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

  mapCrosshair: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -15,
    marginTop: -29,
    alignItems: "center",
    pointerEvents: "none",
  },
  mapHint: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    elevation: 5,
  },
  mapActions: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
