// Carte interactive avec clustering en grille.
// - Quand des points sont proches → bulle affichant le nombre d'observations
// - Tap sur cluster → zoom (réduction du latitudeDelta)
// - Tap sur point unique → bottom sheet avec détails + lien vers le journal + voyage
// - Param ?focusTrip=tripId → ne montre que les observations d'un voyage
import {
  COUNTRY_COORDINATES,
  ENCYCLOPEDIA_DATA,
  Observation,
  Trip,
} from "@/constants/MarineData";
import { STORAGE_KEYS } from "@/constants/Storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import MapView, { Marker, Region } from "react-native-maps";

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
}

type Cluster =
  | { type: "point"; point: MapPoint }
  | { type: "cluster"; latitude: number; longitude: number; points: MapPoint[] };

// --- Clustering en grille ---
// On découpe la zone visible en cellules de "cellSize" degrés.
// Chaque cellule regroupe les points qui y tombent.
function clusterPoints(points: MapPoint[], region: Region): Cluster[] {
  // ~ 8 cellules sur la hauteur visible : plus on est dézoomé, plus on regroupe
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
    if (arr.length === 1) {
      return { type: "point", point: arr[0] };
    }
    // Moyenne des coordonnées
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
  const mapRef = useRef<MapView>(null);

  // Animation d'apparition de la bottom sheet
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
        if (log.userPhoto) imgSource = { uri: log.userPhoto };
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
        };
      });

      setAllPoints(pts);

      // Si on est focus sur un voyage, on cadre dessus
      if (focusTrip && pts.length > 0 && mapRef.current) {
        const lats = pts.map((p) => p.latitude);
        const lons = pts.map((p) => p.longitude);
        const next: Region = {
          latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
          longitude: (Math.min(...lons) + Math.max(...lons)) / 2,
          latitudeDelta: Math.max(
            1,
            (Math.max(...lats) - Math.min(...lats)) * 1.6,
          ),
          longitudeDelta: Math.max(
            1,
            (Math.max(...lons) - Math.min(...lons)) * 1.6,
          ),
        };
        setTimeout(() => mapRef.current?.animateToRegion(next, 800), 300);
      }
    } catch (e) {
      console.error("Erreur chargement carte:", e);
    }
  };

  const clusters = useMemo(
    () => clusterPoints(allPoints, region),
    [allPoints, region],
  );

  const openSheet = (p: MapPoint) => {
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
    // On zoome sur la zone englobant le cluster
    const lats = c.points.map((p) => p.latitude);
    const lons = c.points.map((p) => p.longitude);
    const r: Region = {
      latitude: c.latitude,
      longitude: c.longitude,
      latitudeDelta: Math.max(
        0.2,
        (Math.max(...lats) - Math.min(...lats)) * 2.5,
      ),
      longitudeDelta: Math.max(
        0.2,
        (Math.max(...lons) - Math.min(...lons)) * 2.5,
      ),
    };
    mapRef.current?.animateToRegion(r, 500);
  };

  // Taille de la bulle de cluster en fonction du nombre de points
  const bubbleStyle = (n: number) => {
    const size = Math.min(70, 32 + Math.log2(n) * 12);
    return {
      width: size,
      height: size,
      borderRadius: size / 2,
    };
  };

  const tripForSelected = selected?.tripId
    ? trips.find((t) => t.id === selected.tripId)
    : null;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={(r) => setRegion(r)}
      >
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
                    <Image
                      source={p.imageSource}
                      style={styles.markerImage}
                    />
                  ) : (
                    <View style={styles.defaultMarker} />
                  )}
                  <View style={styles.arrow} />
                </View>
              </Marker>
            );
          } else {
            return (
              <Marker
                key={`c-${idx}`}
                coordinate={{ latitude: c.latitude, longitude: c.longitude }}
                onPress={() => zoomToCluster(c)}
                tracksViewChanges={false}
              >
                <View
                  style={[styles.clusterBubble, bubbleStyle(c.points.length)]}
                >
                  <Text style={styles.clusterCount}>{c.points.length}</Text>
                </View>
              </Marker>
            );
          }
        })}
      </MapView>

      {/* HEADER si focus voyage */}
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

      {/* LÉGENDE flottante */}
      <View style={styles.legend}>
        <Text style={styles.legendTxt}>
          {allPoints.length} observation{allPoints.length > 1 ? "s" : ""}
        </Text>
        <Text style={styles.legendSub}>
          Pincez pour zoomer • tapez les bulles pour développer
        </Text>
      </View>

      {/* BOTTOM SHEET sélection */}
      <Modal visible={!!selected} transparent animationType="none">
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={closeSheet}
        >
          <Animated.View
            style={[
              styles.sheet,
              { transform: [{ translateY: sheetAnim }] },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {selected && (
              <>
                <View style={styles.sheetHandle} />
                <View style={styles.sheetRow}>
                  {selected.imageSource ? (
                    <Image
                      source={selected.imageSource}
                      style={styles.sheetImg}
                    />
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
                    <Text style={styles.sheetBtnTxt}>📔 Voir dans le journal</Text>
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
                          () =>
                            router.push(`/trip/${tripForSelected.id}` as any),
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
    </View>
  );
}

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

  // Cluster bubble
  clusterBubble: {
    backgroundColor: "rgba(0,105,148,0.92)",
    borderWidth: 3,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  clusterCount: { color: "white", fontWeight: "bold", fontSize: 15 },

  focusHeader: {
    position: "absolute",
    top: 50,
    left: 15,
    right: 15,
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

  legend: {
    position: "absolute",
    top: 50,
    right: 15,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    elevation: 3,
    maxWidth: 180,
  },
  legendTxt: { fontWeight: "bold", color: "#006994" },
  legendSub: { fontSize: 10, color: "#666", marginTop: 2 },

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
});
