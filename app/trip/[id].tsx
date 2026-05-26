// Page détail d'un voyage : couverture, dates, observations groupées, mini-carte.
// Permet la navigation bidirectionnelle journal <-> carte <-> voyage.
import {
  ENCYCLOPEDIA_DATA,
  Observation,
  Trip,
} from "@/constants/MarineData";
import { STORAGE_KEYS } from "@/constants/Storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";

const { width } = Dimensions.get("window");

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [logs, setLogs] = useState<Observation[]>([]);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const [savedTrips, savedLogs] = await AsyncStorage.multiGet([
          STORAGE_KEYS.TRIPS,
          STORAGE_KEYS.LOGS,
        ]);
        const trips: Trip[] = savedTrips[1] ? JSON.parse(savedTrips[1]) : [];
        const allLogs: Observation[] = savedLogs[1]
          ? JSON.parse(savedLogs[1])
          : [];
        setTrip(trips.find((t) => t.id === id) ?? null);
        setLogs(allLogs.filter((l) => l.tripId === id));
      };
      load();
    }, [id]),
  );

  // Espèces uniques (pour les stats)
  const uniqueSpecies = useMemo(
    () => Array.from(new Set(logs.map((l) => l.speciesName))),
    [logs],
  );

  // Région de la mini-carte = centroïde + bbox des observations géolocalisées
  const region = useMemo(() => {
    const located = logs.filter((l) => l.latitude && l.longitude);
    if (located.length === 0) {
      return {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 60,
        longitudeDelta: 60,
      };
    }
    const lats = located.map((l) => l.latitude!);
    const lons = located.map((l) => l.longitude!);
    const minLat = Math.min(...lats),
      maxLat = Math.max(...lats);
    const minLon = Math.min(...lons),
      maxLon = Math.max(...lons);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLon + maxLon) / 2,
      latitudeDelta: Math.max(0.5, (maxLat - minLat) * 1.5),
      longitudeDelta: Math.max(0.5, (maxLon - minLon) * 1.5),
    };
  }, [logs]);

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={{ fontSize: 30 }}>🧳</Text>
          <Text style={styles.notFound}>Voyage introuvable</Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.backBtnTxt}>← Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        {/* COUVERTURE */}
        <View style={styles.coverWrap}>
          {trip.coverPhoto ? (
            <Image source={{ uri: trip.coverPhoto }} style={styles.coverImg} />
          ) : (
            <View style={[styles.coverImg, { backgroundColor: trip.color }]}>
              <Text style={{ fontSize: 80 }}>🌊</Text>
            </View>
          )}
          <View style={styles.coverShade} />
          <SafeAreaView style={styles.coverTop}>
            <TouchableOpacity
              style={styles.backBubble}
              onPress={() => router.back()}
            >
              <Text style={{ color: "white", fontSize: 22, fontWeight: "bold" }}>
                ←
              </Text>
            </TouchableOpacity>
          </SafeAreaView>
          <View style={styles.coverInfo}>
            <View
              style={[styles.colorChip, { backgroundColor: trip.color }]}
            />
            <Text style={styles.coverTitle}>{trip.name}</Text>
            <Text style={styles.coverCountry}>📍 {trip.country}</Text>
            <Text style={styles.coverDates}>
              {trip.startDate} → {trip.endDate}
            </Text>
          </View>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <Stat label="Observations" value={String(logs.length)} />
          <Stat label="Espèces" value={String(uniqueSpecies.length)} />
          <Stat
            label="Géolocalisées"
            value={String(logs.filter((l) => l.latitude).length)}
          />
        </View>

        {trip.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesTxt}>{trip.notes}</Text>
          </View>
        ) : null}

        {/* MINI CARTE */}
        {logs.some((l) => l.latitude && l.longitude) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🗺️ Sur la carte</Text>
            <View style={styles.mapWrap}>
              <MapView
                style={{ width: "100%", height: "100%" }}
                initialRegion={region}
                pointerEvents="none"
              >
                {logs
                  .filter((l) => l.latitude && l.longitude)
                  .map((l) => (
                    <Marker
                      key={l.id}
                      coordinate={{
                        latitude: l.latitude!,
                        longitude: l.longitude!,
                      }}
                      pinColor={trip.color}
                    />
                  ))}
              </MapView>
              <TouchableOpacity
                style={styles.openMapBtn}
                onPress={() =>
                  router.push(`/(tabs)/map?focusTrip=${trip.id}` as any)
                }
              >
                <Text style={styles.openMapBtnTxt}>Voir en grand →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* OBSERVATIONS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            🐠 Observations ({logs.length})
          </Text>

          {logs.length === 0 ? (
            <View style={styles.emptyObs}>
              <Text style={{ color: "#666" }}>
                Aucune observation rattachée à ce voyage.
              </Text>
              <TouchableOpacity
                style={[styles.openMapBtn, { marginTop: 12 }]}
                onPress={() => router.push("/(tabs)/logbook")}
              >
                <Text style={styles.openMapBtnTxt}>+ Ajouter une observation</Text>
              </TouchableOpacity>
            </View>
          ) : (
            logs.map((l) => {
              const ency = ENCYCLOPEDIA_DATA[l.speciesName];
              let img;
              if (l.userPhoto) img = { uri: l.userPhoto };
              else if (ency) img = ency.image;
              return (
                <TouchableOpacity
                  key={l.id}
                  style={styles.obsCard}
                  onPress={() => router.push("/(tabs)/logbook")}
                  activeOpacity={0.8}
                >
                  {img ? (
                    <Image source={img} style={styles.obsImg} />
                  ) : (
                    <View style={[styles.obsImg, styles.obsImgFallback]}>
                      <Text>?</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.obsSpecies}>{l.speciesName}</Text>
                    <Text style={styles.obsMeta}>📅 {l.date}</Text>
                    <Text style={styles.obsMeta}>📍 {l.location}</Text>
                    {l.notes ? (
                      <Text style={styles.obsNotes} numberOfLines={2}>
                        {l.notes}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.statBox}>
    <Text style={styles.statVal}>{value}</Text>
    <Text style={styles.statLbl}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f8ff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { fontSize: 16, color: "#666", marginTop: 8 },
  backBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#006994",
    borderRadius: 20,
  },
  backBtnTxt: { color: "white", fontWeight: "bold" },

  coverWrap: { width, height: 280, position: "relative" },
  coverImg: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  coverShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  coverTop: { position: "absolute", top: 0, left: 0, right: 0, padding: 10 },
  backBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  coverInfo: { position: "absolute", bottom: 16, left: 18, right: 18 },
  colorChip: {
    width: 36,
    height: 5,
    borderRadius: 3,
    marginBottom: 8,
  },
  coverTitle: {
    color: "white",
    fontSize: 26,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 4,
  },
  coverCountry: {
    color: "rgba(255,255,255,0.9)",
    marginTop: 6,
    fontSize: 14,
  },
  coverDates: {
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
    fontSize: 13,
  },

  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    marginTop: -30,
    marginBottom: 14,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: "white",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    elevation: 3,
  },
  statVal: { fontSize: 22, fontWeight: "bold", color: "#006994" },
  statLbl: { fontSize: 11, color: "#888", marginTop: 2 },

  notesBox: {
    marginHorizontal: 18,
    marginTop: 5,
    marginBottom: 5,
    backgroundColor: "#fff8e1",
    borderLeftWidth: 4,
    borderLeftColor: "#FFB300",
    padding: 12,
    borderRadius: 8,
  },
  notesTxt: { color: "#5d4037", fontStyle: "italic" },

  section: { marginTop: 14, paddingHorizontal: 18 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#006994",
    marginBottom: 10,
  },
  mapWrap: {
    height: 200,
    borderRadius: 14,
    overflow: "hidden",
    elevation: 3,
    position: "relative",
  },
  openMapBtn: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,105,148,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  openMapBtnTxt: { color: "white", fontWeight: "bold", fontSize: 12 },

  obsCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    elevation: 2,
    alignItems: "center",
  },
  obsImg: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#eee",
  },
  obsImgFallback: { justifyContent: "center", alignItems: "center" },
  obsSpecies: { fontWeight: "bold", color: "#333", fontSize: 15 },
  obsMeta: { fontSize: 12, color: "#666" },
  obsNotes: { fontSize: 12, color: "#006994", fontStyle: "italic", marginTop: 2 },
  emptyObs: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
});
