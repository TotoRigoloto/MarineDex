// Carte voyage partageable — rendue hors-écran, capturée en PNG.
// Format 1080x1350 (post Instagram carré-ish), lisible et beau sur tous les réseaux.
import {
  ENCYCLOPEDIA_DATA,
  getTripCountries,
  Observation,
  Trip,
} from "@/constants/MarineData";
import React, { forwardRef } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

// Déduit les étapes du voyage (pays distincts visités, dans l'ordre chrono des obs)
function buildRouteSteps(
  trip: Trip,
  observations: Observation[],
): string[] {
  // Essaie d'extraire les pays dans l'ordre des observations
  const seen = new Set<string>();
  const steps: string[] = [];
  [...observations]
    .sort((a, b) => {
      const da = parseDmySimple(a.date);
      const db = parseDmySimple(b.date);
      return da - db;
    })
    .forEach((o) => {
      if (o.location && !seen.has(o.location)) {
        seen.add(o.location);
        steps.push(o.location);
      }
    });
  if (steps.length > 0) return steps.slice(0, 6);
  // Fallback sur les pays du voyage
  return getTripCountries(trip).slice(0, 6);
}

function parseDmySimple(dmy: string): number {
  const m = dmy?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return 0;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])).getTime();
}

interface Props {
  trip: Trip;
  observations: Observation[];
  username?: string;
}

const W = 1080;
const H = 1350;

const ShareableTripCard = forwardRef<View, Props>(
  ({ trip, observations, username }, ref) => {
    const uniqueSpecies = [
      ...new Set(observations.map((o) => o.speciesName)),
    ];
    const routeSteps = buildRouteSteps(trip, observations);
    // Top 4 espèces avec image (priorité photo user, sinon encyclopédie)
    const topSpecies = uniqueSpecies.slice(0, 4).map((name) => {
      const obs = observations.find((o) => o.speciesName === name);
      const ency = ENCYCLOPEDIA_DATA[name];
      let img: any = null;
      if (obs?.userPhoto && obs.userPhoto.startsWith("file:"))
        img = { uri: obs.userPhoto };
      else if (ency?.image) img = ency.image;
      return { name, img };
    });

    const days = new Set(observations.map((o) => o.date)).size;

    return (
      <View ref={ref} collapsable={false} style={styles.root}>
        {/* Fond dégradé bleu marine simulé par 3 couches */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#001a2c" }]} />
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "#004d70", opacity: 0.6, top: H * 0.3 },
          ]}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: trip.color, opacity: 0.25, top: H * 0.6 },
          ]}
        />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brand}>🌊 MarineDex</Text>
          {username && (
            <Text style={styles.username}>par {username}</Text>
          )}
        </View>

        {/* Cover du voyage */}
        <View style={styles.coverWrap}>
          {trip.coverPhoto ? (
            <Image
              source={{ uri: trip.coverPhoto }}
              style={styles.cover}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.cover, { backgroundColor: trip.color }]}>
              <Text style={{ fontSize: 180 }}>🌊</Text>
            </View>
          )}
          <View style={[styles.colorBar, { backgroundColor: trip.color }]} />
        </View>

        {/* Titre + pays + dates */}
        <Text style={styles.title} numberOfLines={2}>
          {trip.name}
        </Text>
        <Text style={styles.country}>
          📍 {getTripCountries(trip).join(" · ")}
        </Text>
        <Text style={styles.dates}>
          {trip.startDate} → {trip.endDate}
        </Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatBig value={String(observations.length)} label="Observations" />
          <StatBig value={String(uniqueSpecies.length)} label="Espèces" />
          <StatBig value={String(days)} label="Jours" />
        </View>

        {/* Route strip — trajet visuel */}
        {routeSteps.length > 1 && (
          <View style={styles.routeStrip}>
            {routeSteps.map((step, i) => (
              <React.Fragment key={i}>
                <View style={styles.routeStepWrap}>
                  <View
                    style={[
                      styles.routeDot,
                      { backgroundColor: trip.color },
                    ]}
                  >
                    <Text style={styles.routeDotText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.routeStepLabel} numberOfLines={1}>
                    {step}
                  </Text>
                </View>
                {i < routeSteps.length - 1 && (
                  <View style={styles.routeLineWrap}>
                    {[0, 1, 2].map((d) => (
                      <View
                        key={d}
                        style={[
                          styles.routeLineDash,
                          { backgroundColor: trip.color },
                        ]}
                      />
                    ))}
                  </View>
                )}
              </React.Fragment>
            ))}
          </View>
        )}

        {/* Top espèces */}
        {topSpecies.length > 0 && (
          <View style={styles.speciesGrid}>
            {topSpecies.map((s, i) => (
              <View key={i} style={styles.speciesItem}>
                <View style={styles.speciesAvatar}>
                  {s.img ? (
                    <Image
                      source={s.img}
                      style={styles.speciesImg}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={{ fontSize: 40 }}>🐠</Text>
                  )}
                </View>
                <Text style={styles.speciesName} numberOfLines={2}>
                  {s.name}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTagline}>
            Explorez. Identifiez. Protégez.
          </Text>
          <Text style={styles.footerRevosea}>
            🐬 En partenariat avec Revosea
          </Text>
        </View>
      </View>
    );
  },
);

ShareableTripCard.displayName = "ShareableTripCard";
export default ShareableTripCard;

const StatBig = ({ value, label }: { value: string; label: string }) => (
  <View style={styles.statBig}>
    <Text style={styles.statBigValue}>{value}</Text>
    <Text style={styles.statBigLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  root: {
    width: W,
    height: H,
    paddingHorizontal: 80,
    paddingVertical: 70,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  brand: {
    color: "white",
    fontSize: 38,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  username: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 26,
    fontStyle: "italic",
  },

  coverWrap: {
    width: "100%",
    height: 420,
    borderRadius: 30,
    overflow: "hidden",
    elevation: 10,
    marginBottom: 24,
    position: "relative",
  },
  cover: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  colorBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 10,
  },

  title: {
    color: "white",
    fontSize: 64,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowRadius: 6,
    lineHeight: 70,
  },
  country: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 32,
    marginTop: 6,
  },
  dates: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 26,
    marginTop: 4,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 36,
    gap: 20,
  },
  statBig: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 24,
    paddingVertical: 28,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.18)",
  },
  statBigValue: {
    color: "white",
    fontSize: 64,
    fontWeight: "bold",
  },
  statBigLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 22,
    marginTop: 4,
    fontWeight: "600",
  },

  routeStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    paddingHorizontal: 10,
  },
  routeStepWrap: {
    alignItems: "center",
    maxWidth: 140,
  },
  routeDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.5)",
  },
  routeDotText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  routeStepLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 16,
    marginTop: 6,
    textAlign: "center",
    fontWeight: "600",
  },
  routeLineWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 4,
    marginBottom: 24,
  },
  routeLineDash: {
    width: 10,
    height: 3,
    borderRadius: 2,
    opacity: 0.6,
  },

  speciesGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 36,
    gap: 16,
  },
  speciesItem: { flex: 1, alignItems: "center" },
  speciesAvatar: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.3)",
  },
  speciesImg: { width: 130, height: 130 },
  speciesName: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 10,
    textAlign: "center",
    maxWidth: 180,
  },

  footer: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  footerTagline: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 22,
    fontStyle: "italic",
  },
  footerRevosea: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 20,
    marginTop: 6,
  },
});
