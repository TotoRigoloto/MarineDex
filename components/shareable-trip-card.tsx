// Carte voyage partageable — format story Instagram 1080×1920.
// Rendue hors-écran, capturée en PNG via react-native-view-shot.
// Fond = snapshot MapView (passé en prop) + tracé des spots stylisé.
import {
  Dive,
  getTripCountries,
  Observation,
  Trip,
} from "@/constants/MarineData";
import React, { forwardRef } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

function parseDmySimple(dmy: string): number {
  const m = dmy?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return 0;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])).getTime();
}

// Déduit les étapes du voyage (lieux distincts visités, ordre chrono)
function buildRouteSteps(
  trip: Trip,
  observations: Observation[],
): string[] {
  const seen = new Set<string>();
  const steps: string[] = [];
  [...observations]
    .sort((a, b) => parseDmySimple(a.date) - parseDmySimple(b.date))
    .forEach((o) => {
      if (o.location && !seen.has(o.location)) {
        seen.add(o.location);
        steps.push(o.location);
      }
    });
  if (steps.length > 0) return steps.slice(0, 6);
  return getTripCountries(trip).slice(0, 6);
}

// Formate des minutes totales → "XhXX"
function formatTotalTime(minutes: number): string {
  if (minutes <= 0) return "--";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  return `${h}h${m.toString().padStart(2, "0")}`;
}

interface Props {
  trip: Trip;
  observations: Observation[];
  dives: Dive[];
  mapSnapshotUri?: string; // URI du snapshot MapView en fond
  username?: string;
}

const W = 1080;
const H = 1920;

const ShareableTripCard = forwardRef<View, Props>(
  ({ trip, observations, dives, mapSnapshotUri, username }, ref) => {
    const uniqueSpecies = [
      ...new Set(observations.map((o) => o.speciesName)),
    ];
    const routeSteps = buildRouteSteps(trip, observations);
    const days = new Set(observations.map((o) => o.date)).size;

    // Durée cumulée sous l'eau (somme des durées de plongées)
    const totalMinutes = dives.reduce(
      (acc, d) => acc + (d.durationMin ?? 0),
      0,
    );

    return (
      <View ref={ref} collapsable={false} style={styles.root}>
        {/* Fond : snapshot MapView ou dégradé bleu */}
        {mapSnapshotUri ? (
          <Image
            source={{ uri: mapSnapshotUri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: "#001a2c" }]}
          />
        )}

        {/* Overlays pour lisibilité */}
        <View style={styles.overlayTop} />
        <View style={styles.overlayBottom} />

        {/* Contenu */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.brand}>🌊 MarineDex</Text>
            {username && (
              <Text style={styles.username}>par {username}</Text>
            )}
          </View>

          {/* Badge type */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { borderColor: trip.color + "80" }]}>
              <Text style={[styles.badgeText, { color: trip.color }]}>
                VOYAGE
              </Text>
            </View>
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

          {/* Spacer — laisse la map visible au centre */}
          <View style={{ flex: 1, minHeight: 80 }} />

          {/* Stats row 1 : 3 colonnes (plongées, temps sous l'eau, jours) */}
          <View style={styles.statsRow}>
            <StatCard
              value={String(dives.length)}
              label="PLONGÉES"
              accent
              color={trip.color}
            />
            <StatCard
              value={formatTotalTime(totalMinutes)}
              label="SOUS L'EAU"
              accent
              color={trip.color}
            />
            <StatCard
              value={String(days)}
              label="JOURS"
              accent
              color={trip.color}
            />
          </View>

          {/* Stats row 2 : 2 colonnes (observations, espèces) */}
          <View style={[styles.statsRow, { marginTop: 16 }]}>
            <StatCard
              value={String(observations.length)}
              label="OBSERVATIONS"
            />
            <StatCard
              value={String(uniqueSpecies.length)}
              label="ESPÈCES"
            />
          </View>

          {/* Route strip — tracé textuel des étapes */}
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
      </View>
    );
  },
);

ShareableTripCard.displayName = "ShareableTripCard";
export default ShareableTripCard;

// --- Sous-composant stat ---
const StatCard = ({
  value,
  label,
  accent,
  color,
}: {
  value: string;
  label: string;
  accent?: boolean;
  color?: string;
}) => (
  <View style={styles.statCard}>
    <Text
      style={[
        styles.statValue,
        accent && { color: color || "#FFB300" },
      ]}
    >
      {value}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  root: {
    width: W,
    height: H,
    overflow: "hidden",
  },

  overlayTop: {
    ...StyleSheet.absoluteFillObject,
    height: H * 0.3,
    backgroundColor: "rgba(0,26,44,0.75)",
  },
  overlayBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: H * 0.55,
    backgroundColor: "rgba(0,26,44,0.88)",
  },

  content: {
    flex: 1,
    paddingHorizontal: 70,
    paddingTop: 60,
    paddingBottom: 50,
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
    color: "rgba(255,255,255,0.6)",
    fontSize: 26,
    fontStyle: "italic",
  },

  badgeRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 8,
  },
  badgeText: {
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 3,
  },

  title: {
    color: "white",
    fontSize: 60,
    fontWeight: "bold",
    lineHeight: 68,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 8,
  },
  country: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 32,
    marginTop: 8,
  },
  dates: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 26,
    marginTop: 4,
  },

  statsRow: {
    flexDirection: "row",
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 24,
    paddingVertical: 28,
    alignItems: "center",
  },
  statValue: {
    color: "white",
    fontSize: 52,
    fontWeight: "bold",
  },
  statLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 16,
    marginTop: 6,
    letterSpacing: 1,
    fontWeight: "600",
  },

  routeStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
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
    color: "rgba(255,255,255,0.8)",
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

  footer: {
    marginTop: 32,
    alignItems: "center",
  },
  footerTagline: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 22,
    fontStyle: "italic",
  },
  footerRevosea: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 20,
    marginTop: 6,
  },
});
