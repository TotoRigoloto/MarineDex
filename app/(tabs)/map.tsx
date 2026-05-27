// Carte v2 :
// - Clustering en grille des observations
// - Bottom sheet sur clic d'un point
// - Toggle aires marines protégées (Supabase bdd_zones_protegees)
// - Sélecteur de style de carte (standard / satellite / hybride)
// - Filtres (famille, voyage)
// - Polyline chronologique d'un voyage quand focusTrip est passé
// - Bouton "recentrer sur ma position"
import {
  COUNTRY_COORDINATES,
  ENCYCLOPEDIA_DATA,
  Observation,
  Trip,
} from "@/constants/MarineData";
import { STORAGE_KEYS } from "@/constants/Storage";
import * as H from "@/services/haptics";
import { fetchProtectedZones, getZoneColor, ProtectedZone } from "@/services/mpa";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  Callout,
  MapType,
  Marker,
  Polyline,
  Region,
} from "react-native-maps";

interface MapPoint {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  species: string;
  date: string;
  location: string;
  imageSource: any;
  tripId?: string;
  family?: string;
}

type Cluster =
  | { type: "point"; point: MapPoint }
  | { type: "cluster"; latitude: number; longitude: number; points: MapPoint[] };

function clusterPoints(points: MapPoint[], region: Region): Cluster[] {
  const cellSize = region.latitudeDelta / 8;
  const buckets: Record<string, MapPoint[]> = {};
  points.forEach((p) => {
    const cx = Math.floor(p.longitude / cellSize);
    const cy = Math.floor(p.latitude / cellSize);
    const k = `${cx}_${cy}`;
    if (!buckets[k]) buckets[k] = [];
    buckets[k].push(p);
  });
  return Object.values(buckets).map((arr) => {
    if (arr.length === 1) return { type: "point", point: arr[0] };
    const sumLat = arr.reduce((s, p) => s + p.latitude, 0);
    const sumLon = arr.reduce((s, p) => s + p.longitude, 0);
    return {
      type: "cluster",
      latitude: sumLat / arr.length,
      longitude: sumLon / arr.length,
      points: arr,
    };
  });
}

const MAP_STYLES: { label: string; value: MapType; icon: string }[] = [
  { label: "Standard", value: "standard", icon: "🗺️" },
  { label: "Satellite", value: "satellite", icon: "🛰️" },
  { label: "Hybride", value: "hybrid", icon: "🌍" },
];

export default function MapScreen() {
  const { focusTrip } = useLocalSearchParams<{ focusTrip?: string }>();
  const [allPoints, setAllPoints] = useState<MapPoint[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [region, setRegion] = useState<Region>({
    latitude: 20,
    longitude: 0,
    latitudeDelta: 100,
    longitudeDelta: 100,
  });
  const [selected, setSelected] = useState<MapPoint | null>(null);
  const [mapType, setMapType] = useState<MapType>("standard");
  const [showFilters, setShowFilters] = useState(false);
  const [familyFilter, setFamilyFilter] = useState<string | null>(null);
  const [tripFilter, setTripFilter] = useState<string | null>(null);
  const [showMpa, setShowMpa] = useState(false);
  const [mpaZones, setMpaZones] = useState<ProtectedZone[]>([]);
  const [mpaLoading, setMpaLoading] = useState(false);
  const mapRef = useRef<MapView>(null);
  const sheetAnim = useRef(new Animated.Value(300)).current;

  useFocusEffect(
    useCallback(() => {
      loadPoints();
    }, [focusTrip]),
  );

  const loadPoints = async () => {
    try {
      const [savedLogs, savedTrips] = await AsyncStorage.multiGet([
        STORAGE_KEYS.LOGS,
        STORAGE_KEYS.TRIPS,
      ]);
      const logs: Observation[] = savedLogs[1] ? JSON.parse(savedLogs[1]) : [];
      const tps: Trip[] = savedTrips[1] ? JSON.parse(savedTrips[1]) : [];
      setTrips(tps);

      const filtered = focusTrip
        ? logs.filter((l) => l.tripId === focusTrip)
        : logs;

      const pts: MapPoint[] = filtered.map((log) => {
        let lat = log.latitude;
        let lon = log.longitude;
        if (!lat || !lon) {
          const entry = COUNTRY_COORDINATES[log.location.trim()];
          if (entry) {
            const oc = entry[log.ocean] || Object.values(entry)[0];
            if (oc) {
              const offLat = (Math.random() - 0.5) * 0.5;
              const offLon = (Math.random() - 0.5) * 0.5;
              lat = oc.latitude + offLat;
              lon = oc.longitude + offLon;
            }
          }
          if (!lat) lat = 20;
          if (!lon) lon = 0;
        }
        let imgSource = null;
        if (log.userPhoto && log.userPhoto.startsWith("file:"))
          imgSource = { uri: log.userPhoto };
        else if (ENCYCLOPEDIA_DATA[log.speciesName])
          imgSource = ENCYCLOPEDIA_DATA[log.speciesName].image;

        return {
          id: log.id,
          title: log.speciesName,
          latitude: lat,
          longitude: lon,
          species: log.speciesName,
          date: log.date,
          location: log.location,
          imageSource: imgSource,
          tripId: log.tripId,
          family: ENCYCLOPEDIA_DATA[log.speciesName]?.family,
        };
      });

      setAllPoints(pts);

      if (focusTrip && pts.length > 0 && mapRef.current) {
        const lats = pts.map((p) => p.latitude);
        const lons = pts.map((p) => p.longitude);
        const next: Region = {
          latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
          longitude: (Math.min(...lons) + Math.max(...lons)) / 2,
          latitudeDelta: Math.max(1, (Math.max(...lats) - Math.min(...lats)) * 1.6),
          longitudeDelta: Math.max(1, (Math.max(...lons) - Math.min(...lons)) * 1.6),
        };
        setTimeout(() => mapRef.current?.animateToRegion(next, 800), 300);
      }
    } catch (e) {
      console.error("Erreur chargement carte:", e);
    }
  };

  // Liste des familles disponibles pour le filtre
  const availableFamilies = useMemo(
    () => [...new Set(allPoints.map((p) => p.family).filter(Boolean))] as string[],
    [allPoints],
  );

  // Application des filtres
  const filteredPoints = useMemo(() => {
    return allPoints.filter((p) => {
      if (familyFilter && p.family !== familyFilter) return false;
      if (tripFilter && p.tripId !== tripFilter) return false;
      return true;
    });
  }, [allPoints, familyFilter, tripFilter]);

  const clusters = useMemo(
    () => clusterPoints(filteredPoints, region),
    [filteredPoints, region],
  );

  // Route polyline si focusTrip ou tripFilter
  const routePoints = useMemo(() => {
    const tid = focusTrip ?? tripFilter;
    if (!tid) return null;
    return filteredPoints
      .filter((p) => p.tripId === tid)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((p) => ({ latitude: p.latitude, longitude: p.longitude }));
  }, [focusTrip, tripFilter, filteredPoints]);

  // Charge les MPA quand toggle on
  const toggleMpa = async () => {
    const next = !showMpa;
    setShowMpa(next);
    if (next && mpaZones.length === 0) {
      setMpaLoading(true);
      const zones = await fetchProtectedZones();
      setMpaZones(zones);
      setMpaLoading(false);
    }
  };

  const openSheet = (p: MapPoint) => {
    H.tapLight();
    setSelected(p);
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };
  const closeSheet = () => {
    Animated.timing(sheetAnim, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setSelected(null));
  };

  const zoomToCluster = (c: Extract<Cluster, { type: "cluster" }>) => {
    H.tapMedium();
    const lats = c.points.map((p) => p.latitude);
    const lons = c.points.map((p) => p.longitude);
    const r: Region = {
      latitude: c.latitude,
      longitude: c.longitude,
      latitudeDelta: Math.max(0.2, (Math.max(...lats) - Math.min(...lats)) * 2.5),
      longitudeDelta: Math.max(0.2, (Math.max(...lons) - Math.min(...lons)) * 2.5),
    };
    mapRef.current?.animateToRegion(r, 500);
  };

  const goToMyLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      mapRef.current?.animateToRegion(
        {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        },
        600,
      );
    } catch (e) {
      console.warn(e);
    }
  };

  const bubbleStyle = (n: number) => {
    const size = Math.min(70, 32 + Math.log2(n) * 12);
    return { width: size, height: size, borderRadius: size / 2 };
  };

  const tripForSelected = selected?.tripId
    ? trips.find((t) => t.id === selected.tripId)
    : null;

  const tripColor = focusTrip
    ? trips.find((t) => t.id === focusTrip)?.color ?? "#006994"
    : tripFilter
      ? trips.find((t) => t.id === tripFilter)?.color ?? "#006994"
      : "#006994";

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        mapType={mapType}
        initialRegion={region}
        onRegionChangeComplete={(r) => setRegion(r)}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Polyline route voyage */}
        {routePoints && routePoints.length > 1 && (
          <Polyline
            coordinates={routePoints}
            strokeColor={tripColor}
            strokeWidth={3}
            lineDashPattern={[6, 4]}
          />
        )}

        {/* MPA markers (petits cercles verts/bleus) */}
        {showMpa &&
          mpaZones.map((z) => (
            <Marker
              key={`mpa-${z.id}`}
              coordinate={{ latitude: z.latitude, longitude: z.longitude }}
              tracksViewChanges={false}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View
                style={[
                  styles.mpaMarker,
                  { backgroundColor: getZoneColor(z.label) },
                ]}
              >
                <Text style={{ fontSize: 10 }}>🛡️</Text>
              </View>
              <Callout tooltip>
                <View style={styles.mpaCallout}>
                  <Text style={styles.mpaCalloutTitle} numberOfLines={2}>
                    {z.nom ?? "Aire protégée"}
                  </Text>
                  <Text style={styles.mpaCalloutMeta}>
                    {z.label ?? "—"} • {z.pays ?? z.continent ?? ""}
                  </Text>
                </View>
              </Callout>
            </Marker>
          ))}

        {/* Observations clusterisées */}
        {clusters.map((c, idx) => {
          if (c.type === "point") {
            const p = c.point;
            return (
              <Marker
                key={p.id}
                coordinate={{ latitude: p.latitude, longitude: p.longitude }}
                onPress={() => openSheet(p)}
                tracksViewChanges={false}
              >
                <View style={styles.markerContainer}>
                  {p.imageSource ? (
                    <Image source={p.imageSource} style={styles.markerImage} />
                  ) : (
                    <View style={styles.defaultMarker} />
                  )}
                  <View style={styles.arrow} />
                </View>
              </Marker>
            );
          }
          return (
            <Marker
              key={`c-${idx}`}
              coordinate={{ latitude: c.latitude, longitude: c.longitude }}
              onPress={() => zoomToCluster(c)}
              tracksViewChanges={false}
            >
              <View style={[styles.clusterBubble, bubbleStyle(c.points.length)]}>
                <Text style={styles.clusterCount}>{c.points.length}</Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Header focus voyage */}
      {focusTrip && (
        <View style={styles.focusHeader}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.focusTitle} numberOfLines={1}>
            {trips.find((t) => t.id === focusTrip)?.name ?? "Voyage"}
          </Text>
          <TouchableOpacity onPress={() => router.replace("/(tabs)/map")}>
            <Text style={styles.allTxt}>Tout voir</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Boutons flottants droite : filtres, MPA, style, position */}
      <View style={styles.fabColumn}>
        <FabBtn
          icon="⚙️"
          active={!!familyFilter || !!tripFilter}
          onPress={() => setShowFilters(true)}
        />
        <FabBtn icon="🛡️" active={showMpa} onPress={toggleMpa} loading={mpaLoading} />
        <FabBtn
          icon={MAP_STYLES.find((s) => s.value === mapType)?.icon ?? "🗺️"}
          onPress={() => {
            const idx = MAP_STYLES.findIndex((s) => s.value === mapType);
            const next = MAP_STYLES[(idx + 1) % MAP_STYLES.length].value;
            setMapType(next);
          }}
        />
        <FabBtn icon="📍" onPress={goToMyLocation} />
      </View>

      {/* Légende observations */}
      <View style={styles.legend}>
        <Text style={styles.legendTxt}>
          {filteredPoints.length} obs{filteredPoints.length > 1 ? "." : ""}
          {showMpa && mpaZones.length > 0 ? ` · ${mpaZones.length} MPA` : ""}
        </Text>
      </View>

      {/* Bottom sheet observation */}
      <Modal visible={!!selected} transparent animationType="none">
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={closeSheet}
        >
          <Animated.View
            style={[styles.sheet, { transform: [{ translateY: sheetAnim }] }]}
            onStartShouldSetResponder={() => true}
          >
            {selected && (
              <>
                <View style={styles.sheetHandle} />
                <View style={styles.sheetRow}>
                  {selected.imageSource ? (
                    <Image source={selected.imageSource} style={styles.sheetImg} />
                  ) : (
                    <View style={[styles.sheetImg, styles.sheetImgFallback]}>
                      <Text>?</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetSpecies}>{selected.species}</Text>
                    <Text style={styles.sheetMeta}>📅 {selected.date}</Text>
                    <Text style={styles.sheetMeta}>📍 {selected.location}</Text>
                    {tripForSelected && (
                      <View
                        style={[
                          styles.tripBadge,
                          { backgroundColor: tripForSelected.color },
                        ]}
                      >
                        <Text style={styles.tripBadgeTxt}>
                          🧳 {tripForSelected.name}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.sheetActions}>
                  <TouchableOpacity
                    style={[styles.sheetBtn, { backgroundColor: "#006994" }]}
                    onPress={() => {
                      closeSheet();
                      setTimeout(() => router.push("/(tabs)/logbook"), 200);
                    }}
                  >
                    <Text style={styles.sheetBtnTxt}>📔 Journal</Text>
                  </TouchableOpacity>
                  {tripForSelected && (
                    <TouchableOpacity
                      style={[
                        styles.sheetBtn,
                        { backgroundColor: tripForSelected.color },
                      ]}
                      onPress={() => {
                        closeSheet();
                        setTimeout(
                          () => router.push(`/trip/${tripForSelected.id}` as any),
                          200,
                        );
                      }}
                    >
                      <Text style={styles.sheetBtnTxt}>🧳 Voyage</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Modal filtres */}
      <Modal visible={showFilters} transparent animationType="slide">
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={() => setShowFilters(false)}
        >
          <View style={styles.filterSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <Text style={styles.filterTitle}>Filtrer la carte</Text>

            <Text style={styles.filterLabel}>Par famille</Text>
            <View style={styles.chipRow}>
              <Chip
                label="Toutes"
                active={!familyFilter}
                onPress={() => setFamilyFilter(null)}
              />
              {availableFamilies.map((f) => (
                <Chip
                  key={f}
                  label={f}
                  active={familyFilter === f}
                  onPress={() => setFamilyFilter(f)}
                />
              ))}
            </View>

            <Text style={styles.filterLabel}>Par voyage</Text>
            <View style={styles.chipRow}>
              <Chip
                label="Tous"
                active={!tripFilter}
                onPress={() => setTripFilter(null)}
              />
              {trips.map((t) => (
                <Chip
                  key={t.id}
                  label={`🧳 ${t.name}`}
                  active={tripFilter === t.id}
                  onPress={() => setTripFilter(t.id)}
                  color={t.color}
                />
              ))}
            </View>

            <View style={styles.filterFooter}>
              <TouchableOpacity
                style={[styles.filterBtn, { backgroundColor: "#eee" }]}
                onPress={() => {
                  setFamilyFilter(null);
                  setTripFilter(null);
                }}
              >
                <Text style={{ color: "#333", fontWeight: "bold" }}>
                  Réinitialiser
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterBtn, { backgroundColor: "#006994" }]}
                onPress={() => setShowFilters(false)}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const FabBtn = ({
  icon,
  onPress,
  active,
  loading,
}: {
  icon: string;
  onPress: () => void;
  active?: boolean;
  loading?: boolean;
}) => (
  <TouchableOpacity
    style={[styles.fab, active && styles.fabActive]}
    onPress={onPress}
    disabled={loading}
  >
    <Text style={{ fontSize: 20, opacity: loading ? 0.4 : 1 }}>{icon}</Text>
  </TouchableOpacity>
);

const Chip = ({
  label,
  active,
  onPress,
  color,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  color?: string;
}) => (
  <TouchableOpacity
    style={[
      styles.chip,
      active && { backgroundColor: color ?? "#006994", borderColor: color ?? "#006994" },
    ]}
    onPress={onPress}
  >
    <Text style={[styles.chipTxt, active && { color: "white" }]} numberOfLines={1}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: "100%", height: "100%" },

  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
  },
  markerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "white",
    backgroundColor: "#006994",
  },
  defaultMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#ff5a5f",
    borderWidth: 2,
    borderColor: "white",
  },
  arrow: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "white",
    marginTop: -2,
  },
  clusterBubble: {
    backgroundColor: "rgba(0,105,148,0.92)",
    borderWidth: 3,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  clusterCount: { color: "white", fontWeight: "bold", fontSize: 15 },

  mpaMarker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.9,
    elevation: 2,
  },
  mpaCallout: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 8,
    minWidth: 160,
    maxWidth: 220,
    elevation: 4,
  },
  mpaCalloutTitle: { fontWeight: "bold", color: "#006994", fontSize: 13 },
  mpaCalloutMeta: { fontSize: 11, color: "#666", marginTop: 2 },

  focusHeader: {
    position: "absolute",
    top: 50,
    left: 15,
    right: 80,
    backgroundColor: "rgba(255,255,255,0.95)",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    elevation: 5,
  },
  backArrow: { fontSize: 22, fontWeight: "bold", color: "#006994" },
  focusTitle: {
    flex: 1,
    textAlign: "center",
    fontWeight: "bold",
    color: "#006994",
    fontSize: 15,
  },
  allTxt: { color: "#006994", fontWeight: "bold", fontSize: 12 },

  fabColumn: {
    position: "absolute",
    top: 50,
    right: 15,
    gap: 10,
  },
  fab: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  fabActive: { backgroundColor: "#006994" },

  legend: {
    position: "absolute",
    bottom: 100,
    left: 15,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    elevation: 2,
  },
  legendTxt: { fontWeight: "bold", color: "#006994", fontSize: 12 },

  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    paddingBottom: 30,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ddd",
    marginBottom: 12,
  },
  sheetRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  sheetImg: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 14,
    backgroundColor: "#eee",
  },
  sheetImgFallback: { justifyContent: "center", alignItems: "center" },
  sheetSpecies: { fontSize: 18, fontWeight: "bold", color: "#006994" },
  sheetMeta: { fontSize: 13, color: "#666", marginTop: 2 },
  tripBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 6,
  },
  tripBadgeTxt: { color: "white", fontSize: 11, fontWeight: "bold" },
  sheetActions: { flexDirection: "row", gap: 10 },
  sheetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  sheetBtnTxt: { color: "white", fontWeight: "bold", fontSize: 13 },

  filterSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
    maxHeight: "80%",
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#006994",
    textAlign: "center",
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333",
    marginTop: 12,
    marginBottom: 8,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "white",
  },
  chipTxt: { fontSize: 12, color: "#333", fontWeight: "600" },
  filterFooter: { flexDirection: "row", gap: 10, marginTop: 20 },
  filterBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
});
