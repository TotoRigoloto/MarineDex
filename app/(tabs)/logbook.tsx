// Journal de Bord avec deux modes :
//   • Voyages (storyboards) : regroupe les observations par voyage
//   • Observations : la liste classique
// Chaque observation peut être rattachée à un voyage (tripId).
// Cliquer sur un voyage → ouvre /trip/[id]
// Cliquer sur une observation → ouvre le modal d'édition

import {
  Animal,
  Dive,
  ENCYCLOPEDIA_DATA,
  GEOGRAPHY_DB,
  getTripCountries,
  initialAnimals,
  Observation,
  TIME_OF_DAY_LABELS,
  TimeOfDay,
  Trip,
  TRIP_COLORS,
  COUNTRY_COORDINATES,
} from "@/constants/MarineData";
import { STORAGE_KEYS } from "@/constants/Storage";
import EmptyState from "@/components/empty-state";
import { SkeletonList } from "@/components/skeleton";
import { loadDives, saveDive, deleteDive as deleteDiveLocal } from "@/services/dives";
import * as H from "@/services/haptics";
import { deleteObsCloud, deleteDiveCloud, syncAll } from "@/services/sync";
import { generateUUID } from "@/services/uuid";
import { fetchWeather, toIsoDate } from "@/services/weather";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
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
  const params = useLocalSearchParams<{ newObsForTrip?: string; newDiveForTrip?: string; newObsForDive?: string }>();
  const [logs, setLogs] = useState<Observation[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [mode, setMode] = useState<Mode>("trips");
  const [loading, setLoading] = useState(true);

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
  const [obsDiveId, setObsDiveId] = useState<string | undefined>(undefined);
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

  // Détails plongée (optionnels)
  const [depthInput, setDepthInput] = useState("");
  const [durationInput, setDurationInput] = useState("");
  const [visibilityInput, setVisibilityInput] = useState("");
  const [waterTempInput, setWaterTempInput] = useState("");
  const [showDiveDetails, setShowDiveDetails] = useState(false);
  const [weatherSnapshot, setWeatherSnapshot] = useState<
    Observation["weather"] | undefined
  >(undefined);
  const [fetchingWeather, setFetchingWeather] = useState(false);

  // État global des plongées
  const [dives, setDives] = useState<Dive[]>([]);

  // États formulaire plongée
  const [diveFormVisible, setDiveFormVisible] = useState(false);
  const [editingDiveId, setEditingDiveId] = useState<string | null>(null);
  const [diveDateInput, setDiveDateInput] = useState("");
  const [diveTimeOfDay, setDiveTimeOfDay] = useState<TimeOfDay>("morning");
  const [diveCountryInput, setDiveCountryInput] = useState("");
  const [diveCountrySuggestions, setDiveCountrySuggestions] = useState<string[]>([]);
  const [diveOceanInput, setDiveOceanInput] = useState("");
  const [diveOceanOptions, setDiveOceanOptions] = useState<string[]>([]);
  const [diveDepthInput, setDiveDepthInput] = useState("");
  const [diveDurationInput, setDiveDurationInput] = useState("");
  const [diveVisibilityInput, setDiveVisibilityInput] = useState("");
  const [diveWaterTempInput, setDiveWaterTempInput] = useState("");
  const [diveNotesInput, setDiveNotesInput] = useState("");
  const [diveTripId, setDiveTripId] = useState<string | undefined>(undefined);
  const [diveCoords, setDiveCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [diveWeatherSnapshot, setDiveWeatherSnapshot] = useState<Dive["weather"] | undefined>(undefined);
  const [diveFetchingWeather, setDiveFetchingWeather] = useState(false);

  // États formulaire voyage
  const [tripFormVisible, setTripFormVisible] = useState(false);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [tripName, setTripName] = useState("");
  const [tripCountries, setTripCountries] = useState<string[]>([]);
  const [tripCountryInput, setTripCountryInput] = useState("");
  const [tripCountrySuggestions, setTripCountrySuggestions] = useState<
    string[]
  >([]);
  const [tripStart, setTripStart] = useState("");
  const [tripEnd, setTripEnd] = useState("");
  const [tripCover, setTripCover] = useState<string | undefined>(undefined);
  const [tripNotes, setTripNotes] = useState("");
  const [tripColor, setTripColor] = useState(TRIP_COLORS[0]);

  // ====== Observation form ======
  const resetDiveFields = useCallback(() => {
    setDepthInput("");
    setDurationInput("");
    setVisibilityInput("");
    setWaterTempInput("");
    setShowDiveDetails(false);
    setWeatherSnapshot(undefined);
  }, []); // Vide car les setters d'état sont stables par défaut

  const openNewLogModal = useCallback(
    (tripId?: string) => {
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
      setObsDiveId(undefined);
      resetDiveFields();
      // Si on crée depuis un voyage mono-pays, pré-remplir le pays
      if (tripId) {
        const t = trips.find((tt) => tt.id === tripId);
        if (t) {
          const countries = getTripCountries(t);
          if (countries.length === 1) setLocationInput(countries[0]);
        }
      }
      setFormVisible(true);
    },
    [trips, resetDiveFields],
  ); // ✨ Dépend de 'trips' et de la fonction 'resetDiveFields'

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, []),
  );

  // Auto-ouverture du form d'observation quand on vient de trip/[id] avec ?newObsForTrip=xxx
  useFocusEffect(
    useCallback(() => {
      if (!params.newObsForTrip) return;
      // Petit délai pour s'assurer que loadAll a fini de remplir trips
      const t = setTimeout(() => {
        setMode("observations");
        openNewLogModal(params.newObsForTrip);
        // Vide le paramètre pour ne pas re-déclencher
        router.setParams({ newObsForTrip: undefined } as any);
      }, 300);
      return () => clearTimeout(t);
    }, [params.newObsForTrip, openNewLogModal]),
  );

  const loadAll = async () => {
    try {
      const [savedLogs, savedTrips] = await AsyncStorage.multiGet([
        STORAGE_KEYS.LOGS,
        STORAGE_KEYS.TRIPS,
      ]);
      setLogs(savedLogs[1] ? JSON.parse(savedLogs[1]) : []);
      // Migration douce : normaliser les anciens trips sans countries[]
      const rawTrips: Trip[] = savedTrips[1]
        ? JSON.parse(savedTrips[1])
        : [];
      const migratedTrips = rawTrips.map((t) => {
        if (!t.countries?.length && t.country) {
          return { ...t, countries: [t.country] };
        }
        return t;
      });
      setTrips(migratedTrips);
      // Charger les plongées
      const allDives = await loadDives();
      setDives(allDives);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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
    // Préremplir dive details s'ils existent
    setDepthInput(item.depthM != null ? String(item.depthM) : "");
    setDurationInput(item.durationMin != null ? String(item.durationMin) : "");
    setVisibilityInput(
      item.visibilityM != null ? String(item.visibilityM) : "",
    );
    setWaterTempInput(item.waterTempC != null ? String(item.waterTempC) : "");
    setWeatherSnapshot(item.weather);
    setShowDiveDetails(
      item.depthM != null ||
        item.durationMin != null ||
        item.visibilityM != null ||
        item.waterTempC != null ||
        !!item.weather,
    );
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

  // Récupère météo à partir des coords + date du form
  const fetchWeatherForObs = async () => {
    if (!exactCoords) {
      Alert.alert(
        "Pas de coordonnées",
        "Capture d'abord ta position GPS ou choisis un point sur la carte.",
      );
      return;
    }
    setFetchingWeather(true);
    try {
      const iso = toIsoDate(dateInput);
      const snap = await fetchWeather(
        exactCoords.latitude,
        exactCoords.longitude,
        iso,
      );
      if (snap) {
        setWeatherSnapshot(snap);
        Alert.alert(
          "Météo enregistrée ✓",
          "Conditions ajoutées à l'observation.",
        );
      } else {
        Alert.alert("Erreur", "Impossible de récupérer la météo.");
      }
    } finally {
      setFetchingWeather(false);
    }
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
    // Parse helpers — on accepte les , et . comme séparateur décimal
    const toNum = (s: string) => {
      const n = parseFloat(s.replace(",", "."));
      return Number.isFinite(n) ? n : undefined;
    };

    const data: Observation = {
      id: editingLogId || generateUUID(),
      speciesName: speciesInput,
      date: dateInput,
      location: locationInput || "Inconnu",
      ocean: oceanInput || "Non précisé",
      notes: notesInput,
      userPhoto: selectedPhoto,
      latitude: exactCoords?.latitude,
      longitude: exactCoords?.longitude,
      tripId: obsTripId,
      diveId: obsDiveId,
      depthM: toNum(depthInput),
      durationMin: toNum(durationInput),
      visibilityM: toNum(visibilityInput),
      waterTempC: toNum(waterTempInput),
      weather: weatherSnapshot,
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
      H.success();
      // Sync silencieuse en arrière-plan
      syncAll().catch(() => {});
    } catch (e) {
      console.error(e);
      H.error();
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
    setTripCountries([]);
    setTripCountryInput("");
    setTripCountrySuggestions([]);
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
    setTripCountries(getTripCountries(t));
    setTripCountryInput("");
    setTripCountrySuggestions([]);
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

  // Insère automatiquement les / pour formater "12032025" en "12/03/2025"
  const autoFormatDate = (raw: string): string => {
    // On vire tout ce qui n'est pas chiffre, puis on regroupe en DD/MM/YYYY
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    let out = digits;
    if (digits.length > 2) out = digits.slice(0, 2) + "/" + digits.slice(2);
    if (digits.length > 4)
      out =
        digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
    return out;
  };

  // Valide une date DD/MM/YYYY → Date (ou null)
  const parseDmy = (s: string): Date | null => {
    const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return null;
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    // Vérifie que la date est cohérente (pas 32/13/...)
    if (
      d.getFullYear() !== Number(m[3]) ||
      d.getMonth() !== Number(m[2]) - 1 ||
      d.getDate() !== Number(m[1])
    )
      return null;
    return d;
  };

  // ====== Formulaire plongée ======
  const checkDiveOcean = (countryName: string) => {
    const key = Object.keys(GEOGRAPHY_DB).find(
      (k) => k.toLowerCase() === countryName.trim().toLowerCase(),
    );
    if (key) {
      const oceans = GEOGRAPHY_DB[key];
      setDiveOceanOptions(oceans);
      if (oceans.length === 1) setDiveOceanInput(oceans[0]);
    } else {
      setDiveOceanOptions([]);
    }
  };

  const openNewDiveModal = useCallback(
    (tripId?: string) => {
      setEditingDiveId(null);
      setDiveDateInput(new Date().toLocaleDateString());
      setDiveTimeOfDay("morning");
      setDiveCountryInput("");
      setDiveCountrySuggestions([]);
      setDiveOceanInput("");
      setDiveOceanOptions([]);
      setDiveDepthInput("");
      setDiveDurationInput("");
      setDiveVisibilityInput("");
      setDiveWaterTempInput("");
      setDiveNotesInput("");
      setDiveTripId(tripId);
      setDiveCoords(null);
      setDiveWeatherSnapshot(undefined);
      // Si voyage mono-pays, pré-remplir
      if (tripId) {
        const t = trips.find((tt) => tt.id === tripId);
        if (t) {
          const countries = getTripCountries(t);
          if (countries.length === 1) {
            setDiveCountryInput(countries[0]);
            checkDiveOcean(countries[0]);
          }
        }
      }
      setDiveFormVisible(true);
    },
    [trips],
  );

  // Auto-ouverture du form de plongée quand on vient de trip/[id] avec ?newDiveForTrip=xxx
  useFocusEffect(
    useCallback(() => {
      if (!params.newDiveForTrip) return;
      const t = setTimeout(() => {
        setMode("trips");
        openNewDiveModal(params.newDiveForTrip);
        router.setParams({ newDiveForTrip: undefined } as any);
      }, 300);
      return () => clearTimeout(t);
    }, [params.newDiveForTrip, openNewDiveModal]),
  );

  // Auto-ouverture du form d'observation pré-rattaché à une plongée (?newObsForDive=xxx)
  useFocusEffect(
    useCallback(() => {
      if (!params.newObsForDive) return;
      const t = setTimeout(() => {
        const dive = dives.find((d) => d.id === params.newObsForDive);
        if (dive) {
          setMode("observations");
          setEditingLogId(null);
          setSpeciesInput("");
          setLocationInput(dive.country);
          setOceanInput(dive.ocean);
          setOceanOptions([]);
          setDateInput(dive.date);
          setNotesInput("");
          setSelectedPhoto(undefined);
          setFilteredSpecies([]);
          setFilteredLocations([]);
          setObsTripId(dive.tripId);
          setObsDiveId(dive.id);
          setDepthInput(dive.depthMax != null ? String(dive.depthMax) : "");
          setDurationInput(dive.durationMin != null ? String(dive.durationMin) : "");
          setVisibilityInput(dive.visibilityM != null ? String(dive.visibilityM) : "");
          setWaterTempInput(dive.waterTempC != null ? String(dive.waterTempC) : "");
          setWeatherSnapshot(dive.weather);
          if (dive.depthMax || dive.durationMin || dive.visibilityM || dive.waterTempC || dive.weather) {
            setShowDiveDetails(true);
          }
          if (dive.latitude && dive.longitude) {
            setExactCoords({ latitude: dive.latitude, longitude: dive.longitude });
          } else {
            setExactCoords(null);
          }
          setFormVisible(true);
        }
        router.setParams({ newObsForDive: undefined } as any);
      }, 300);
      return () => clearTimeout(t);
    }, [params.newObsForDive, dives]),
  );

  // Édition d'une plongée existante (long-press sur une dive card)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const openEditDiveModal = (dive: Dive) => {
    setEditingDiveId(dive.id);
    setDiveDateInput(dive.date);
    setDiveTimeOfDay(dive.timeOfDay);
    setDiveCountryInput(dive.country);
    checkDiveOcean(dive.country);
    setDiveOceanInput(dive.ocean);
    setDiveDepthInput(dive.depthMax?.toString() ?? "");
    setDiveDurationInput(dive.durationMin?.toString() ?? "");
    setDiveVisibilityInput(dive.visibilityM?.toString() ?? "");
    setDiveWaterTempInput(dive.waterTempC?.toString() ?? "");
    setDiveNotesInput(dive.notes ?? "");
    setDiveTripId(dive.tripId);
    setDiveCoords(
      dive.latitude && dive.longitude
        ? { latitude: dive.latitude, longitude: dive.longitude }
        : null,
    );
    setDiveWeatherSnapshot(dive.weather);
    setDiveFormVisible(true);
  };

  const handleSaveDive = async () => {
    if (!diveCountryInput.trim()) {
      Alert.alert("Erreur", "Indique le pays de ta plongée.");
      return;
    }
    const countryKey = Object.keys(GEOGRAPHY_DB).find(
      (k) => k.toLowerCase() === diveCountryInput.trim().toLowerCase(),
    );
    if (!countryKey) {
      Alert.alert("Pays invalide", "Sélectionne un pays dans les suggestions.");
      return;
    }

    const toNum = (s: string) => {
      const n = parseFloat(s.replace(",", "."));
      return Number.isFinite(n) ? n : undefined;
    };

    const dive: Dive = {
      id: editingDiveId || generateUUID(),
      tripId: diveTripId,
      date: diveDateInput || new Date().toLocaleDateString(),
      timeOfDay: diveTimeOfDay,
      country: countryKey,
      ocean: diveOceanInput || "Non précisé",
      latitude: diveCoords?.latitude,
      longitude: diveCoords?.longitude,
      depthMax: toNum(diveDepthInput),
      durationMin: toNum(diveDurationInput),
      visibilityM: toNum(diveVisibilityInput),
      waterTempC: toNum(diveWaterTempInput),
      weather: diveWeatherSnapshot,
      notes: diveNotesInput || undefined,
      createdAt: editingDiveId
        ? (dives.find((d) => d.id === editingDiveId)?.createdAt ?? Date.now())
        : Date.now(),
    };

    try {
      const updated = await saveDive(dive);
      setDives(updated);
      setDiveFormVisible(false);
      H.success();
    } catch (e) {
      console.error(e);
      H.error();
    }
  };

  const handleDeleteDive = async () => {
    if (!editingDiveId) return;
    Alert.alert(
      "Supprimer cette plongée ?",
      "Les observations rattachées seront détachées.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const updated = await deleteDiveLocal(editingDiveId);
              setDives(updated);
              // Détacher les observations
              const detached = logs.map((l) =>
                l.diveId === editingDiveId ? { ...l, diveId: undefined } : l,
              );
              setLogs(detached);
              await AsyncStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(detached));
              deleteDiveCloud(editingDiveId);
              setDiveFormVisible(false);
              H.tapHeavy();
            } catch (e) {
              console.error(e);
              H.error();
            }
          },
        },
      ],
    );
  };

  // Fetch météo pour la plongée
  const fetchDiveWeather = async () => {
    if (!diveCoords && !diveCountryInput) return;
    setDiveFetchingWeather(true);
    try {
      const isoDate = toIsoDate(diveDateInput);
      let lat = diveCoords?.latitude;
      let lon = diveCoords?.longitude;
      // Fallback sur les coordonnées du pays si pas de GPS
      if (!lat || !lon) {
        const countryKey = Object.keys(COUNTRY_COORDINATES).find(
          (k) => k.toLowerCase() === diveCountryInput.trim().toLowerCase(),
        );
        if (countryKey) {
          const oceans = COUNTRY_COORDINATES[countryKey];
          const firstOcean = Object.values(oceans)[0];
          if (firstOcean) {
            lat = firstOcean.latitude;
            lon = firstOcean.longitude;
          }
        }
      }
      if (lat && lon && isoDate) {
        const w = await fetchWeather(lat, lon, isoDate);
        setDiveWeatherSnapshot(w ?? undefined);
      }
    } catch (e) {
      console.warn("[dive] weather fetch error:", e);
    } finally {
      setDiveFetchingWeather(false);
    }
  };

  // Ajouter un pays à la sélection multi-pays
  const addTripCountry = useCallback(
    (country: string) => {
      const key = Object.keys(GEOGRAPHY_DB).find(
        (k) => k.toLowerCase() === country.trim().toLowerCase(),
      );
      if (!key || tripCountries.includes(key)) return;
      setTripCountries((prev) => [...prev, key]);
      setTripCountryInput("");
      setTripCountrySuggestions([]);
      H.tapLight();
    },
    [tripCountries],
  );

  const removeTripCountry = useCallback((country: string) => {
    setTripCountries((prev) => prev.filter((c) => c !== country));
    H.tapLight();
  }, []);

  const saveTrip = async () => {
    // Nom
    if (!tripName.trim()) {
      Alert.alert("Erreur", "Donne un nom à ton voyage !");
      return;
    }

    // Au moins un pays sélectionné
    if (tripCountries.length === 0) {
      Alert.alert(
        "Pays manquant",
        "Sélectionne au moins un pays pour ton voyage.",
      );
      return;
    }

    // Déduit les océans depuis les pays sélectionnés
    const oceansSet = new Set<string>();
    tripCountries.forEach((c) => {
      const list = GEOGRAPHY_DB[c];
      if (list) list.forEach((o) => oceansSet.add(o));
    });

    // Dates : format DD/MM/YYYY obligatoire
    const startDate = parseDmy(tripStart);
    const endDate = parseDmy(tripEnd);
    if (!startDate) {
      Alert.alert(
        "Date de début invalide",
        "Format attendu : JJ/MM/AAAA (ex: 12/03/2025)",
      );
      return;
    }
    if (!endDate) {
      Alert.alert(
        "Date de fin invalide",
        "Format attendu : JJ/MM/AAAA (ex: 25/03/2025)",
      );
      return;
    }
    if (endDate.getTime() < startDate.getTime()) {
      Alert.alert(
        "Dates incohérentes",
        "La date de fin doit être postérieure ou égale à la date de début.",
      );
      return;
    }

    const t: Trip = {
      id: editingTripId || generateUUID(),
      name: tripName.trim(),
      country: tripCountries[0], // Rétro-compat : premier pays
      countries: tripCountries,
      oceans: [...oceansSet],
      startDate: tripStart,
      endDate: tripEnd,
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
    H.success();
    syncAll().catch(() => {});
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
            <Text style={styles.tripCardCountry}>
              📍 {getTripCountries(item).join(" · ")}
            </Text>
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
    H.warning();
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
          deleteObsCloud(id).catch(() => {});
          H.tapHeavy();
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
          onPress={() => {
            if (mode === "observations") {
              openNewLogModal();
            } else {
              // En mode voyages, proposer voyage ou plongée
              Alert.alert("Créer…", undefined, [
                { text: "Nouveau voyage", onPress: openNewTripModal },
                {
                  text: "Nouvelle plongée",
                  onPress: () => openNewDiveModal(),
                },
                { text: "Annuler", style: "cancel" },
              ]);
            }
          }}
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

      {loading ? (
        <SkeletonList type={mode === "trips" ? "trip" : "obs"} count={3} />
      ) : mode === "trips" ? (
        trips.length === 0 ? (
          <EmptyState
            emoji="🧳"
            title="Aucun voyage pour l'instant"
            subtitle={
              "Crée ton premier storyboard\n(ex: « Mon voyage aux Philippines »)"
            }
            ctaLabel="+ Nouveau voyage"
            onCtaPress={() => {
              H.tapMedium();
              openNewTripModal();
            }}
          />
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
        <EmptyState
          emoji="🐠"
          title="Ton carnet est vide"
          subtitle="Ajoute ta première observation marine !"
          ctaLabel="+ Nouvelle observation"
          onCtaPress={() => {
            H.tapMedium();
            openNewLogModal();
          }}
        />
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

          {/* Chips de familles — Scroll horizontal */}
          {availableFamilies.length > 0 && (
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              directionalLockEnabled={true}
              alwaysBounceVertical={false}
              style={styles.familyChipsScroll}
              contentContainerStyle={styles.familyChips}
            >
              <TouchableOpacity
                style={[styles.famChip, !familyFilter && styles.famChipActive]}
                onPress={() => setFamilyFilter(null)}
                activeOpacity={0.7}
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
                  activeOpacity={0.7}
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

      {/* ============ MODAL FORMULAIRE PLONGÉE ============ */}
      <Modal visible={diveFormVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView keyboardShouldPersistTaps="handled">
                <Text style={styles.modalTitle}>
                  {editingDiveId ? "Modifier la plongée" : "Nouvelle plongée"}
                </Text>

                {/* Date */}
                <Text style={styles.label}>Date (JJ/MM/AAAA)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="12/03/2025"
                  value={diveDateInput}
                  onChangeText={(t) => setDiveDateInput(autoFormatDate(t))}
                  keyboardType="number-pad"
                  maxLength={10}
                />

                {/* Moment de la journée */}
                <Text style={styles.label}>Moment de la journée</Text>
                <View style={styles.chipsRow}>
                  {(Object.entries(TIME_OF_DAY_LABELS) as [TimeOfDay, string][]).map(
                    ([key, label]) => (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.chip,
                          {
                            backgroundColor:
                              diveTimeOfDay === key ? "#006994" : "#006994" + "22",
                          },
                        ]}
                        onPress={() => {
                          setDiveTimeOfDay(key);
                          H.tapLight();
                        }}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: diveTimeOfDay === key ? "white" : "#006994",
                            },
                          ]}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    ),
                  )}
                </View>

                {/* Pays */}
                <Text style={styles.label}>Pays *</Text>
                {/* Si rattachée à un voyage multi-pays → chips rapides */}
                {diveTripId &&
                  (() => {
                    const linkedTrip = trips.find((t) => t.id === diveTripId);
                    const countries = linkedTrip
                      ? getTripCountries(linkedTrip)
                      : [];
                    if (countries.length > 1) {
                      return (
                        <View style={styles.chipsRow}>
                          {countries.map((c) => (
                            <TouchableOpacity
                              key={c}
                              style={[
                                styles.chip,
                                {
                                  backgroundColor:
                                    diveCountryInput === c
                                      ? "#006994"
                                      : "#006994" + "22",
                                },
                              ]}
                              onPress={() => {
                                setDiveCountryInput(c);
                                checkDiveOcean(c);
                                H.tapLight();
                              }}
                            >
                              <Text
                                style={[
                                  styles.chipText,
                                  {
                                    color:
                                      diveCountryInput === c ? "white" : "#006994",
                                  },
                                ]}
                              >
                                {c}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      );
                    }
                    return null;
                  })()}
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Égypte..."
                  value={diveCountryInput}
                  onChangeText={(text) => {
                    setDiveCountryInput(text);
                    if (text.length > 0) {
                      setDiveCountrySuggestions(
                        Object.keys(GEOGRAPHY_DB)
                          .filter((c) =>
                            c.toLowerCase().includes(text.toLowerCase()),
                          )
                          .slice(0, 8),
                      );
                    } else {
                      setDiveCountrySuggestions([]);
                    }
                  }}
                  onBlur={() => checkDiveOcean(diveCountryInput)}
                />
                {diveCountrySuggestions.length > 0 && (
                  <View style={styles.suggestionsBox}>
                    {diveCountrySuggestions.map((c, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.suggestionItem}
                        onPress={() => {
                          setDiveCountryInput(c);
                          setDiveCountrySuggestions([]);
                          checkDiveOcean(c);
                        }}
                      >
                        <Text>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Océan */}
                {diveOceanOptions.length > 1 && (
                  <>
                    <Text style={styles.label}>Océan / Mer</Text>
                    <View style={styles.chipsRow}>
                      {diveOceanOptions.map((o) => (
                        <TouchableOpacity
                          key={o}
                          style={[
                            styles.chip,
                            {
                              backgroundColor:
                                diveOceanInput === o ? "#006994" : "#006994" + "22",
                            },
                          ]}
                          onPress={() => {
                            setDiveOceanInput(o);
                            H.tapLight();
                          }}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              {
                                color: diveOceanInput === o ? "white" : "#006994",
                              },
                            ]}
                          >
                            {o}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                {/* Conditions */}
                <Text style={styles.label}>Conditions (optionnel)</Text>
                <View style={styles.diveGrid}>
                  <View style={styles.diveCell}>
                    <Text style={styles.diveLbl}>📏 Profondeur (m)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="ex: 32"
                      value={diveDepthInput}
                      onChangeText={setDiveDepthInput}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.diveCell}>
                    <Text style={styles.diveLbl}>⏱️ Durée (min)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="ex: 55"
                      value={diveDurationInput}
                      onChangeText={setDiveDurationInput}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={styles.diveCell}>
                    <Text style={styles.diveLbl}>👁️ Visibilité (m)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="ex: 20"
                      value={diveVisibilityInput}
                      onChangeText={setDiveVisibilityInput}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.diveCell}>
                    <Text style={styles.diveLbl}>🌡️ T° eau (°C)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="ex: 26"
                      value={diveWaterTempInput}
                      onChangeText={setDiveWaterTempInput}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                {/* Météo auto */}
                <TouchableOpacity
                  style={[styles.locationBtn, { marginBottom: 12, alignSelf: "flex-start" }]}
                  onPress={fetchDiveWeather}
                  disabled={diveFetchingWeather}
                >
                  <Text style={styles.locationBtnText}>
                    {diveFetchingWeather ? "Chargement…" : "🌤️ Récupérer la météo"}
                  </Text>
                </TouchableOpacity>
                {diveWeatherSnapshot && (
                  <Text style={styles.gpsOk}>
                    ✅ Météo : {diveWeatherSnapshot.airTempC ?? "?"}°C,
                    vent {diveWeatherSnapshot.windKmh ?? "?"}km/h
                  </Text>
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
                      !diveTripId && styles.tripChipActive,
                    ]}
                    onPress={() => setDiveTripId(undefined)}
                  >
                    <Text
                      style={[
                        styles.tripChipTxt,
                        !diveTripId && { color: "white" },
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
                        diveTripId === t.id && {
                          backgroundColor: t.color,
                          borderColor: t.color,
                        },
                      ]}
                      onPress={() => setDiveTripId(t.id)}
                    >
                      <Text
                        style={[
                          styles.tripChipTxt,
                          diveTripId === t.id && { color: "white" },
                        ]}
                      >
                        🧳 {t.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Notes */}
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, { height: 60 }]}
                  multiline
                  placeholder="Récif nord, courant modéré…"
                  value={diveNotesInput}
                  onChangeText={setDiveNotesInput}
                />

                {/* Boutons */}
                <View style={styles.btnRow}>
                  {editingDiveId && (
                    <TouchableOpacity
                      style={styles.btnDelete}
                      onPress={handleDeleteDive}
                    >
                      <Text style={styles.btnText}>🗑️</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.btnCancel}
                    onPress={() => setDiveFormVisible(false)}
                  >
                    <Text style={styles.btnText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.btnSave}
                    onPress={handleSaveDive}
                  >
                    <Text style={styles.btnText}>
                      {editingDiveId ? "Mettre à jour" : "Créer"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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

                <Text style={styles.label}>Pays / Destinations *</Text>
                {/* Chips des pays sélectionnés */}
                {tripCountries.length > 0 && (
                  <View style={styles.chipsRow}>
                    {tripCountries.map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={[
                          styles.chip,
                          { backgroundColor: tripColor + "22" },
                        ]}
                        onPress={() => removeTripCountry(c)}
                      >
                        <Text style={[styles.chipText, { color: tripColor }]}>
                          {c} ✕
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <TextInput
                  style={styles.input}
                  placeholder={
                    tripCountries.length > 0
                      ? "Ajouter un autre pays…"
                      : "Ex: Philippines (choisir dans la liste)"
                  }
                  value={tripCountryInput}
                  onChangeText={(text) => {
                    setTripCountryInput(text);
                    if (text.length > 0) {
                      const all = Object.keys(GEOGRAPHY_DB);
                      setTripCountrySuggestions(
                        all
                          .filter(
                            (c) =>
                              c.toLowerCase().includes(text.toLowerCase()) &&
                              !tripCountries.includes(c),
                          )
                          .slice(0, 8),
                      );
                    } else {
                      setTripCountrySuggestions([]);
                    }
                  }}
                />
                {tripCountrySuggestions.length > 0 && (
                  <View style={styles.suggestionsBox}>
                    {tripCountrySuggestions.map((c, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.suggestionItem}
                        onPress={() => addTripCountry(c)}
                      >
                        <Text>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {tripCountryInput.length > 0 &&
                  tripCountrySuggestions.length === 0 &&
                  !Object.keys(GEOGRAPHY_DB).some(
                    (k) =>
                      k.toLowerCase() === tripCountryInput.toLowerCase() &&
                      !tripCountries.includes(k),
                  ) && (
                    <Text style={styles.fieldHint}>
                      ⚠️ Pays non reconnu. Commence à taper pour voir les
                      suggestions.
                    </Text>
                  )}

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Du * (JJ/MM/AAAA)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="12/03/2025"
                      value={tripStart}
                      onChangeText={(t) => setTripStart(autoFormatDate(t))}
                      keyboardType="number-pad"
                      maxLength={10}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Au * (JJ/MM/AAAA)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="25/03/2025"
                      value={tripEnd}
                      onChangeText={(t) => setTripEnd(autoFormatDate(t))}
                      keyboardType="number-pad"
                      maxLength={10}
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
                {/* Si voyage multi-pays sélectionné → choix rapide parmi les pays du voyage */}
                {obsTripId &&
                  (() => {
                    const linkedTrip = trips.find((t) => t.id === obsTripId);
                    const countries = linkedTrip
                      ? getTripCountries(linkedTrip)
                      : [];
                    if (countries.length > 1) {
                      return (
                        <View style={styles.chipsRow}>
                          {countries.map((c) => (
                            <TouchableOpacity
                              key={c}
                              style={[
                                styles.chip,
                                {
                                  backgroundColor:
                                    locationInput === c
                                      ? linkedTrip!.color
                                      : linkedTrip!.color + "22",
                                },
                              ]}
                              onPress={() => {
                                setLocationInput(c);
                                checkOcean(c);
                                H.tapLight();
                              }}
                            >
                              <Text
                                style={[
                                  styles.chipText,
                                  {
                                    color:
                                      locationInput === c
                                        ? "white"
                                        : linkedTrip!.color,
                                  },
                                ]}
                              >
                                {c}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      );
                    }
                    return null;
                  })()}
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

                {/* Rattacher à une plongée */}
                {(() => {
                  // Plongées disponibles : du voyage sélectionné ou récentes (48h)
                  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
                  const availableDives = dives.filter((d) => {
                    if (obsTripId && d.tripId === obsTripId) return true;
                    if (d.createdAt >= cutoff) return true;
                    return false;
                  });
                  if (availableDives.length === 0) return null;
                  return (
                    <>
                      <Text style={styles.label}>Rattacher à une plongée :</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginBottom: 12 }}
                      >
                        <TouchableOpacity
                          style={[
                            styles.tripChip,
                            !obsDiveId && styles.tripChipActive,
                          ]}
                          onPress={() => setObsDiveId(undefined)}
                        >
                          <Text
                            style={[
                              styles.tripChipTxt,
                              !obsDiveId && { color: "white" },
                            ]}
                          >
                            Aucune
                          </Text>
                        </TouchableOpacity>
                        {availableDives.map((d) => (
                          <TouchableOpacity
                            key={d.id}
                            style={[
                              styles.tripChip,
                              obsDiveId === d.id && {
                                backgroundColor: "#006994",
                                borderColor: "#006994",
                              },
                            ]}
                            onPress={() => {
                              setObsDiveId(d.id);
                              // Pré-remplir les champs depuis la plongée
                              setLocationInput(d.country);
                              setOceanInput(d.ocean);
                              setDateInput(d.date);
                              if (d.tripId) setObsTripId(d.tripId);
                              // Propager les conditions de la plongée
                              if (d.depthMax != null) setDepthInput(String(d.depthMax));
                              if (d.durationMin != null) setDurationInput(String(d.durationMin));
                              if (d.visibilityM != null) setVisibilityInput(String(d.visibilityM));
                              if (d.waterTempC != null) setWaterTempInput(String(d.waterTempC));
                              if (d.weather) setWeatherSnapshot(d.weather);
                              // Ouvrir la section si des conditions existent
                              if (d.depthMax || d.durationMin || d.visibilityM || d.waterTempC || d.weather) {
                                setShowDiveDetails(true);
                              }
                              // Pré-remplir les coordonnées si dispo
                              if (d.latitude && d.longitude) {
                                setExactCoords({ latitude: d.latitude, longitude: d.longitude });
                              }
                              H.tapLight();
                            }}
                          >
                            <Text
                              style={[
                                styles.tripChipTxt,
                                obsDiveId === d.id && { color: "white" },
                              ]}
                            >
                              🤿 {d.date} {TIME_OF_DAY_LABELS[d.timeOfDay]?.split(" ")[0]} {d.country}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </>
                  );
                })()}

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

                {/* ===== Section pliable : Détails de plongée ===== */}
                <TouchableOpacity
                  style={styles.diveToggle}
                  onPress={() => setShowDiveDetails(!showDiveDetails)}
                >
                  <Text style={styles.diveToggleTxt}>
                    🤿 Détails de plongée {showDiveDetails ? "▾" : "▸"}
                  </Text>
                </TouchableOpacity>

                {showDiveDetails && (
                  <View style={styles.diveBox}>
                    <View style={styles.diveGrid}>
                      <View style={styles.diveCell}>
                        <Text style={styles.diveLbl}>📏 Profondeur (m)</Text>
                        <TextInput
                          style={styles.input}
                          value={depthInput}
                          onChangeText={setDepthInput}
                          keyboardType="decimal-pad"
                          placeholder="ex: 18"
                        />
                      </View>
                      <View style={styles.diveCell}>
                        <Text style={styles.diveLbl}>⏱️ Durée (min)</Text>
                        <TextInput
                          style={styles.input}
                          value={durationInput}
                          onChangeText={setDurationInput}
                          keyboardType="number-pad"
                          placeholder="ex: 45"
                        />
                      </View>
                      <View style={styles.diveCell}>
                        <Text style={styles.diveLbl}>👁️ Visibilité (m)</Text>
                        <TextInput
                          style={styles.input}
                          value={visibilityInput}
                          onChangeText={setVisibilityInput}
                          keyboardType="decimal-pad"
                          placeholder="ex: 15"
                        />
                      </View>
                      <View style={styles.diveCell}>
                        <Text style={styles.diveLbl}>🌡️ T° eau (°C)</Text>
                        <TextInput
                          style={styles.input}
                          value={waterTempInput}
                          onChangeText={setWaterTempInput}
                          keyboardType="decimal-pad"
                          placeholder="ex: 26"
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.weatherBtn}
                      onPress={fetchWeatherForObs}
                      disabled={fetchingWeather}
                    >
                      <Text style={styles.weatherBtnTxt}>
                        {fetchingWeather
                          ? "Récupération…"
                          : weatherSnapshot
                            ? "🌤️ Mettre à jour la météo"
                            : "🌤️ Récupérer la météo (Open-Meteo)"}
                      </Text>
                    </TouchableOpacity>

                    {weatherSnapshot && (
                      <View style={styles.weatherChips}>
                        {weatherSnapshot.airTempC != null && (
                          <Text style={styles.weatherChip}>
                            🌡️ {Math.round(weatherSnapshot.airTempC)}°C air
                          </Text>
                        )}
                        {weatherSnapshot.windKmh != null && (
                          <Text style={styles.weatherChip}>
                            💨 {Math.round(weatherSnapshot.windKmh)} km/h
                          </Text>
                        )}
                        {weatherSnapshot.waveHeightM != null && (
                          <Text style={styles.weatherChip}>
                            🌊 {weatherSnapshot.waveHeightM} m
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                )}

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
  familyChipsScroll: { height: 60, marginBottom: 12, flexGrow: 0 },
  familyChips: {
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    //height: "100%",
  },
  famChip: {
    height: 42, // hauteur fixe identique pour tous les chips
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: "#ccc",
    backgroundColor: "white",
    marginRight: 8,
  },
  famChipActive: { backgroundColor: "#006994", borderColor: "#006994" },
  famChipTxt: { fontSize: 14, color: "#444", fontWeight: "600" },
  famChipTxtActive: { color: "white" },

  // Dive details
  diveToggle: {
    backgroundColor: "#e3f2fd",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 4,
  },
  diveToggleTxt: { color: "#006994", fontWeight: "bold", fontSize: 14 },
  diveBox: {
    backgroundColor: "#f6fbff",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0eef7",
  },
  diveGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  diveCell: { width: "47%" },
  diveLbl: { fontSize: 11, color: "#666", marginBottom: 2 },
  weatherBtn: {
    backgroundColor: "#0288D1",
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
    alignItems: "center",
  },
  weatherBtnTxt: { color: "white", fontWeight: "bold", fontSize: 13 },
  weatherChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  weatherChip: {
    backgroundColor: "white",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 11,
    color: "#333",
    borderWidth: 1,
    borderColor: "#cfe7f8",
  },

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
    maxHeight: 200,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 10,
    borderRadius: 5,
  },
  fieldHint: {
    fontSize: 11,
    color: "#dc3545",
    marginTop: -4,
    marginBottom: 10,
    fontStyle: "italic",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
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
