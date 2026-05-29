// Carte plongée partageable — format story Instagram 1080×1920.
// Rendue hors-écran, capturée en PNG via react-native-view-shot.
// L'utilisateur choisit une photo d'observation en fond.
import {
  Dive,
  ENCYCLOPEDIA_DATA,
  Observation,
} from "@/constants/MarineData";
import React, { forwardRef } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

interface Props {
  dive: Dive;
  observations: Observation[]; // observations rattachées à cette plongée
  backgroundPhoto?: string; // URI photo choisie par l'user en fond
  username?: string;
}

const W = 1080;
const H = 1920;

// Formate une durée en minutes → "XhXXmin"
function formatDuration(minutes?: number): string {
  if (!minutes) return "--";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  return `${h}h${m.toString().padStart(2, "0")}min`;
}

const ShareableDiveCard = forwardRef<View, Props>(
  ({ dive, observations, backgroundPhoto, username }, ref) => {
    const uniqueSpecies = [
      ...new Set(observations.map((o) => o.speciesName)),
    ];

    // Top 5 espèces avec image (priorité photo user, sinon encyclopédie)
    const topSpecies = uniqueSpecies.slice(0, 5).map((name) => {
      const obs = observations.find((o) => o.speciesName === name);
      const ency = ENCYCLOPEDIA_DATA[name];
      let img: any = null;
      if (obs?.userPhoto && obs.userPhoto.startsWith("file:"))
        img = { uri: obs.userPhoto };
      else if (ency?.image) img = ency.image;
      return { name, img };
    });

    const remaining = Math.max(0, uniqueSpecies.length - 5);

    return (
      <View ref={ref} collapsable={false} style={styles.root}>
        {/* Fond : photo choisie ou dégradé bleu */}
        {backgroundPhoto ? (
          <Image
            source={{ uri: backgroundPhoto }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: "#001a2c" }]}
          />
        )}

        {/* Overlay gradient pour lisibilité */}
        <View style={styles.overlayTop} />
        <View style={styles.overlayBottom} />

        {/* Contenu */}
        <View style={styles.content}>
          {/* Header MarineDex */}
          <View style={styles.header}>
            <Text style={styles.brand}>🌊 MarineDex</Text>
            {username && (
              <Text style={styles.username}>par {username}</Text>
            )}
          </View>

          {/* Spacer haut — laisse la photo visible */}
          <View style={{ flex: 1 }} />

          {/* Badge type */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>PLONGÉE</Text>
            </View>
          </View>

          {/* Lieu */}
          <Text style={styles.location} numberOfLines={2}>
            📍 {dive.country || "Lieu inconnu"}
          </Text>
          {dive.ocean ? (
            <Text style={styles.ocean}>{dive.ocean}</Text>
          ) : null}
          <Text style={styles.date}>{dive.date}</Text>

          {/* Stats grid 2×2 */}
          <View style={styles.statsGrid}>
            <StatCard
              value={formatDuration(dive.durationMin)}
              label="DURÉE"
              accent
            />
            <StatCard
              value={dive.depthMax ? `${dive.depthMax}m` : "--"}
              label="PROFONDEUR"
              accent
            />
            <StatCard
              value={String(observations.length)}
              label="OBSERVATIONS"
            />
            <StatCard
              value={String(uniqueSpecies.length)}
              label="ESPÈCES"
            />
          </View>

          {/* Conditions (si dispo) */}
          {(dive.visibilityM || dive.waterTempC) && (
            <View style={styles.conditionsRow}>
              {dive.waterTempC != null && (
                <Text style={styles.conditionChip}>
                  🌡 {dive.waterTempC}°C
                </Text>
              )}
              {dive.visibilityM != null && (
                <Text style={styles.conditionChip}>
                  👁 {dive.visibilityM}m visi
                </Text>
              )}
            </View>
          )}

          {/* Top espèces — avatars circulaires */}
          {topSpecies.length > 0 && (
            <View style={styles.speciesRow}>
              {topSpecies.map((s, i) => (
                <View key={i} style={styles.speciesAvatarWrap}>
                  <View style={styles.speciesAvatar}>
                    {s.img ? (
                      <Image
                        source={s.img}
                        style={styles.speciesImg}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={{ fontSize: 36 }}>🐠</Text>
                    )}
                  </View>
                  <Text style={styles.speciesName} numberOfLines={1}>
                    {s.name}
                  </Text>
                </View>
              ))}
              {remaining > 0 && (
                <View style={styles.speciesAvatarWrap}>
                  <View style={styles.speciesAvatar}>
                    <Text style={styles.remainingText}>+{remaining}</Text>
                  </View>
                </View>
              )}
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

ShareableDiveCard.displayName = "ShareableDiveCard";
export default ShareableDiveCard;

// --- Sous-composant stat ---
const StatCard = ({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent?: boolean;
}) => (
  <View style={styles.statCard}>
    <Text style={[styles.statValue, accent && styles.statValueAccent]}>
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

  // Overlays dégradés pour lisibilité du texte sur la photo
  overlayTop: {
    ...StyleSheet.absoluteFillObject,
    height: H * 0.35,
    backgroundColor: "rgba(0,26,44,0.6)",
  },
  overlayBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: H * 0.65,
    backgroundColor: "rgba(0,26,44,0.85)",
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
    backgroundColor: "rgba(255,179,0,0.2)",
    borderWidth: 1.5,
    borderColor: "rgba(255,179,0,0.5)",
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 8,
  },
  badgeText: {
    color: "#FFB300",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 3,
  },

  location: {
    color: "white",
    fontSize: 56,
    fontWeight: "bold",
    lineHeight: 64,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowRadius: 8,
  },
  ocean: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 30,
    marginTop: 4,
  },
  date: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 26,
    marginTop: 4,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 40,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 24,
    paddingVertical: 32,
    alignItems: "center",
  },
  statValue: {
    color: "white",
    fontSize: 56,
    fontWeight: "bold",
  },
  statValueAccent: {
    color: "#FFB300",
  },
  statLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 18,
    marginTop: 6,
    letterSpacing: 1,
    fontWeight: "600",
  },

  conditionsRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 24,
    justifyContent: "center",
  },
  conditionChip: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 24,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    overflow: "hidden",
  },

  speciesRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 36,
  },
  speciesAvatarWrap: {
    alignItems: "center",
    maxWidth: 140,
  },
  speciesAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  speciesImg: {
    width: 80,
    height: 80,
  },
  speciesName: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
  remainingText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 28,
    fontWeight: "bold",
  },

  footer: {
    marginTop: "auto",
    paddingTop: 20,
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
