// Page détail d'un voyage v2 :
// - Onglets : Vue d'ensemble · Timeline · Galerie
// - Vue d'ensemble : couverture, stats, mini-carte, liste observations
// - Timeline : observations groupées par jour (ordre chronologique)
// - Galerie : grille des photos (utilisateur + encyclopédie)
// - Bouton "Exporter en image" (placeholder vers task 11)
import {
  ENCYCLOPEDIA_DATA,
  Observation,
  Trip,
} from "@/constants/MarineData";
import { STORAGE_KEYS } from "@/constants/Storage";
import { weatherEmoji } from "@/services/weather";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";

const { width } = Dimensions.get("window");

type Tab = "overview" | "timeline" | "gallery";

// Parse "DD/MM/YYYY" → Date (ou null)
function parseDate(dmy: string): Date | null {
  if (!dmy) return null;
  const m = dmy.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [logs, setLogs] = useState<Observation[]>([]);
  const [tab, setTab] = useState<Tab>("overview");
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);

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

  const uniqueSpecies = useMemo(
    () => Array.from(new Set(logs.map((l) => l.speciesName))),
    [logs],
  );

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

  // Timeline : groupes par jour
  const timelineGroups = useMemo(() => {
    const map = new Map<string, Observation[]>();
    [...logs]
      .sort((a, b) => {
        const da = parseDate(a.date)?.getTime() ?? 0;
        const db = parseDate(b.date)?.getTime() ?? 0;
        return da - db;
      })
      .forEach((o) => {
        const key = o.date || "Sans date";
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(o);
      });
    return [...map.entries()].map(([date, obs]) => ({ date, obs }));
  }, [logs]);

  // Galerie : toutes les photos (user + encyclopédie en fallback)
  const galleryItems = useMemo(() => {
    return logs.map((l) => {
      let img: any = null;
      let uri: string | null = null;
      if (l.userPhoto) {
        img = { uri: l.userPhoto };
        uri = l.userPhoto;
      } else if (ENCYCLOPEDIA_DATA[l.speciesName]?.image) {
        img = ENCYCLOPEDIA_DATA[l.speciesName].image;
      }
      return {
        id: l.id,
        species: l.speciesName,
        date: l.date,
        img,
        uri,
      };
    });
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

        {/* BARRE D'ACTIONS RAPIDES */}
        <View style={styles.ctaBar}>
          <TouchableOpacity
            style={[styles.ctaBarBtn, { backgroundColor: trip.color }]}
            onPress={() =>
              router.push(`/(tabs)/map?focusTrip=${trip.id}` as any)
            }
          >
            <Text style={styles.ctaBarBtnTxt}>🗺️ Voir sur la carte</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ctaBarBtn, { backgroundColor: "#0288D1" }]}
            onPress={() =>
              router.push(`/(tabs)/logbook?newObsForTrip=${trip.id}` as any)
            }
          >
            <Text style={styles.ctaBarBtnTxt}>+ Observation</Text>
          </TouchableOpacity>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <Stat label="Observations" value={String(logs.length)} />
          <Stat label="Espèces" value={String(uniqueSpecies.length)} />
          <Stat label="Jours" value={String(timelineGroups.length)} />
        </View>

        {trip.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesTxt}>{trip.notes}</Text>
          </View>
        ) : null}

        {/* TABS */}
        <View style={styles.tabBar}>
          <TabBtn label="Aperçu" active={tab === "overview"} onPress={() => setTab("overview")} />
          <TabBtn label="Timeline" active={tab === "timeline"} onPress={() => setTab("timeline")} />
          <TabBtn label="Galerie" active={tab === "gallery"} onPress={() => setTab("gallery")} />
        </View>

        {/* CONTENU ONGLET */}
        {tab === "overview" && (
          <>
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

            {/* LISTE OBSERVATIONS */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                🐠 Observations ({logs.length})
              </Text>
              {logs.length === 0 ? (
                <View style={styles.emptyObs}>
                  <Text style={{ color: "#666", textAlign: "center" }}>
                    Aucune observation rattachée à ce voyage.
                  </Text>
                  <TouchableOpacity
                    style={[styles.openMapBtn, { marginTop: 12, position: "relative", right: 0, bottom: 0 }]}
                    onPress={() =>
                      router.push(`/(tabs)/logbook?newObsForTrip=${trip.id}` as any)
                    }
                  >
                    <Text style={styles.openMapBtnTxt}>+ Ajouter</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {logs.map((l) => <ObsCard key={l.id} obs={l} />)}
                  {/* Bouton ajouter aussi quand il y a déjà des obs */}
                  <TouchableOpacity
                    style={styles.addObsBtn}
                    onPress={() =>
                      router.push(`/(tabs)/logbook?newObsForTrip=${trip.id}` as any)
                    }
                  >
                    <Text style={styles.addObsBtnTxt}>+ Ajouter une observation</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </>
        )}

        {tab === "timeline" && (
          <View style={styles.section}>
            {timelineGroups.length === 0 ? (
              <View style={styles.emptyObs}>
                <Text style={{ color: "#666" }}>
                  Aucune observation à afficher.
                </Text>
              </View>
            ) : (
              timelineGroups.map((g, idx) => (
                <View key={idx} style={styles.timelineDay}>
                  <View style={styles.timelineHeader}>
                    <View
                      style={[styles.timelineDot, { backgroundColor: trip.color }]}
                    />
                    <Text style={styles.timelineDate}>{g.date}</Text>
                    <Text style={styles.timelineCount}>
                      {g.obs.length} obs.
                    </Text>
                  </View>
                  <View style={[styles.timelineLine, { backgroundColor: trip.color }]} />
                  <View style={styles.timelineBody}>
                    {g.obs.map((o) => (
                      <ObsCard key={o.id} obs={o} compact />
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {tab === "gallery" && (
          <View style={[styles.section, { paddingHorizontal: 12 }]}>
            {galleryItems.length === 0 ? (
              <View style={styles.emptyObs}>
                <Text style={{ color: "#666" }}>Aucune photo.</Text>
              </View>
            ) : (
              <View style={styles.galleryGrid}>
                {galleryItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.galleryItem}
                    onPress={() => item.uri && setLightboxUri(item.uri)}
                    activeOpacity={0.8}
                  >
                    {item.img ? (
                      <Image
                        source={item.img}
                        style={styles.galleryImg}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.galleryImg, styles.galleryFallback]}>
                        <Text>?</Text>
                      </View>
                    )}
                    <View style={styles.galleryCaption}>
                      <Text style={styles.galleryCaptionTxt} numberOfLines={1}>
                        {item.species}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* LIGHTBOX */}
      <Modal visible={!!lightboxUri} transparent animationType="fade">
        <TouchableOpacity
          style={styles.lightboxBg}
          activeOpacity={1}
          onPress={() => setLightboxUri(null)}
        >
          {lightboxUri && (
            <Image
              source={{ uri: lightboxUri }}
              style={styles.lightboxImg}
              resizeMode="contain"
            />
          )}
          <Text style={styles.lightboxClose}>✕  Toucher pour fermer</Text>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// --- COMPONENTS ---
const Stat = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.statBox}>
    <Text style={styles.statVal}>{value}</Text>
    <Text style={styles.statLbl}>{label}</Text>
  </View>
);

const TabBtn = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.tabBtn, active && styles.tabBtnActive]}
    onPress={onPress}
  >
    <Text style={[styles.tabBtnTxt, active && styles.tabBtnTxtActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const ObsCard = ({ obs, compact }: { obs: Observation; compact?: boolean }) => {
  const ency = ENCYCLOPEDIA_DATA[obs.speciesName];
  let img: any = null;
  if (obs.userPhoto) img = { uri: obs.userPhoto };
  else if (ency?.image) img = ency.image;

  const hasDive =
    obs.depthM != null ||
    obs.durationMin != null ||
    obs.visibilityM != null ||
    obs.waterTempC != null;

  return (
    <View style={[styles.obsCard, compact && { marginBottom: 8 }]}>
      {img ? (
        <Image source={img} style={styles.obsImg} />
      ) : (
        <View style={[styles.obsImg, styles.obsImgFallback]}>
          <Text>?</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.obsSpecies}>{obs.speciesName}</Text>
        <Text style={styles.obsMeta}>📅 {obs.date}</Text>
        <Text style={styles.obsMeta}>📍 {obs.location}</Text>
        {hasDive && (
          <View style={styles.diveRow}>
            {obs.depthM != null && (
              <DivePill icon="📏" txt={`${obs.depthM}m`} />
            )}
            {obs.durationMin != null && (
              <DivePill icon="⏱️" txt={`${obs.durationMin}'`} />
            )}
            {obs.visibilityM != null && (
              <DivePill icon="👁️" txt={`${obs.visibilityM}m`} />
            )}
            {obs.waterTempC != null && (
              <DivePill icon="🌡️" txt={`${obs.waterTempC}°`} />
            )}
            {obs.weather?.weatherCode != null && (
              <DivePill
                icon={weatherEmoji(obs.weather.weatherCode)}
                txt={
                  obs.weather.airTempC != null
                    ? `${Math.round(obs.weather.airTempC)}°C`
                    : "météo"
                }
              />
            )}
          </View>
        )}
        {obs.notes ? (
          <Text style={styles.obsNotes} numberOfLines={2}>
            {obs.notes}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const DivePill = ({ icon, txt }: { icon: string; txt: string }) => (
  <View style={styles.divePill}>
    <Text style={{ fontSize: 11 }}>
      {icon} {txt}
    </Text>
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
  colorChip: { width: 36, height: 5, borderRadius: 3, marginBottom: 8 },
  coverTitle: {
    color: "white",
    fontSize: 26,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 4,
  },
  coverCountry: { color: "rgba(255,255,255,0.9)", marginTop: 6, fontSize: 14 },
  coverDates: { color: "rgba(255,255,255,0.85)", marginTop: 4, fontSize: 13 },

  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    marginTop: 12,
    marginBottom: 4,
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

  // Tabs
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 18,
    marginTop: 14,
    backgroundColor: "white",
    borderRadius: 22,
    padding: 4,
    elevation: 2,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 18,
    alignItems: "center",
  },
  tabBtnActive: { backgroundColor: "#006994" },
  tabBtnTxt: { color: "#006994", fontWeight: "600", fontSize: 13 },
  tabBtnTxtActive: { color: "white" },

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
    alignItems: "flex-start",
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
  obsNotes: {
    fontSize: 12,
    color: "#006994",
    fontStyle: "italic",
    marginTop: 4,
  },
  emptyObs: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  addObsBtn: {
    backgroundColor: "#006994",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
    elevation: 2,
  },
  addObsBtnTxt: { color: "white", fontWeight: "bold" },
  ctaBar: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 18,
    marginTop: 10,
  },
  ctaBarBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    elevation: 2,
  },
  ctaBarBtnTxt: { color: "white", fontWeight: "bold", fontSize: 13 },

  // Dive details
  diveRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
  divePill: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },

  // Timeline
  timelineDay: { marginBottom: 18 },
  timelineHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  timelineDate: { fontWeight: "bold", color: "#006994", fontSize: 14 },
  timelineCount: {
    marginLeft: "auto",
    fontSize: 11,
    color: "#888",
  },
  timelineLine: {
    position: "absolute",
    left: 5,
    top: 18,
    bottom: 0,
    width: 2,
    opacity: 0.3,
  },
  timelineBody: { paddingLeft: 22 },

  // Gallery
  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  galleryItem: {
    width: (width - 24 - 16) / 3, // 3 colonnes : 12 padding x2 + 8 gap x2
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "white",
    elevation: 1,
  },
  galleryImg: {
    width: "100%",
    height: (width - 24 - 16) / 3, // carré explicite
    backgroundColor: "#eee",
  },
  galleryFallback: { justifyContent: "center", alignItems: "center" },
  galleryCaption: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  galleryCaptionTxt: { fontSize: 10, color: "#444" },

  // Lightbox
  lightboxBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  lightboxImg: { width: "100%", height: "80%" },
  lightboxClose: {
    color: "white",
    marginTop: 20,
    fontSize: 13,
  },
});
