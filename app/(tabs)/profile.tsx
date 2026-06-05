// Profil enrichi :
// - Avatar composable SVG (peau, cheveux, visage, tenue, accessoire)
// - Pseudo personnalisable
// - Stats détaillées (voyages, observations, espèces, pays, photos)
// - Streak adaptative selon le mode utilisateur
// - Badges enrichis avec progression visuelle
// - Partage du profil et lien vers Revosea
import AvatarBuilder from "@/components/avatar-builder";
import AvatarDisplay from "@/components/avatar-display";
import {
  Animal,
  initialAnimals,
  Observation,
  Trip,
} from "@/constants/MarineData";
import {
  AvatarConfig,
  DEFAULT_AVATAR_CONFIG,
} from "@/constants/AvatarData";
import { STORAGE_KEYS } from "@/constants/Storage";
import * as H from "@/services/haptics";
import {
  buildShareText,
  computeGoals,
  computeStreak,
  GoalSection,
  USER_MODE_DESCRIPTIONS,
  USER_MODE_LABELS,
  UserMode,
} from "@/services/stats";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// --- GRADES ---
const RANKS = [
  { name: "Baigneur", minXp: 0, color: "#81D4FA" },
  { name: "Plongeur Open Water", minXp: 500, color: "#4FC3F7" },
  { name: "Explorateur", minXp: 1500, color: "#29B6F6" },
  { name: "Dive Master", minXp: 3000, color: "#039BE5" },
  { name: "Commandant", minXp: 5000, color: "#0277BD" },
  { name: "Légende des Océans", minXp: 10000, color: "#01579B" },
];

// --- BADGES ENRICHIS ---
// Catégorisés : Familles, Quantité, Géographie, Voyages, Rareté, Médias
type BadgeKind =
  | "family"
  | "countries"
  | "obs_count"
  | "trip_count"
  | "rarity"
  | "photos";

interface BadgeDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  kind: BadgeKind;
  target: number;
  family?: string;
}

const BADGES_CONFIG: BadgeDef[] = [
  // Quantité
  {
    id: "first_dive",
    title: "Première Bulle",
    description: "Première observation",
    icon: "💧",
    kind: "obs_count",
    target: 1,
  },
  {
    id: "ten_obs",
    title: "Carnet Tenu",
    description: "10 observations enregistrées",
    icon: "📔",
    kind: "obs_count",
    target: 10,
  },
  {
    id: "fifty_obs",
    title: "Explorateur Assidu",
    description: "50 observations",
    icon: "🔭",
    kind: "obs_count",
    target: 50,
  },

  // Familles
  {
    id: "shark_lover",
    title: "Grand Requin",
    description: "3 espèces de requins",
    icon: "🦈",
    kind: "family",
    target: 3,
    family: "Requin",
  },
  {
    id: "whale_watcher",
    title: "Ami des Géants",
    description: "3 cétacés différents",
    icon: "🐋",
    kind: "family",
    target: 3,
    family: "Cétacé",
  },
  {
    id: "turtle_fan",
    title: "Carapace",
    description: "2 espèces de tortues",
    icon: "🐢",
    kind: "family",
    target: 2,
    family: "Tortue",
  },
  {
    id: "ray_rider",
    title: "Ailes de Mer",
    description: "2 espèces de raies",
    icon: "🪁",
    kind: "family",
    target: 2,
    family: "Raie",
  },
  {
    id: "fish_expert",
    title: "Ichtyologue",
    description: "5 poissons identifiés",
    icon: "🐠",
    kind: "family",
    target: 5,
    family: "Poisson osseux",
  },

  // Géographie
  {
    id: "globetrotter",
    title: "Globetrotter",
    description: "Visite 3 pays",
    icon: "🌍",
    kind: "countries",
    target: 3,
  },
  {
    id: "world_tour",
    title: "Tour du Monde",
    description: "Visite 7 pays",
    icon: "✈️",
    kind: "countries",
    target: 7,
  },

  // Voyages
  {
    id: "first_trip",
    title: "Premier Voyage",
    description: "Crée ton premier voyage",
    icon: "🧳",
    kind: "trip_count",
    target: 1,
  },
  {
    id: "trip_master",
    title: "Grand Voyageur",
    description: "5 voyages documentés",
    icon: "🗺️",
    kind: "trip_count",
    target: 5,
  },

  // Rareté
  {
    id: "rare_find",
    title: "Chasseur de Légendes",
    description: "Observe une espèce rare",
    icon: "✨",
    kind: "rarity",
    target: 1,
  },
  {
    id: "legend_3",
    title: "Triple Légende",
    description: "3 espèces rares",
    icon: "🌟",
    kind: "rarity",
    target: 3,
  },

  // Photos
  {
    id: "photographer",
    title: "Œil d'Or",
    description: "10 photos personnelles",
    icon: "📸",
    kind: "photos",
    target: 10,
  },
];

export default function ProfileScreen() {
  const [userXp, setUserXp] = useState(0);
  const [logs, setLogs] = useState<Observation[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [pokedex, setPokedex] = useState<Animal[]>(initialAnimals);

  const [username, setUsername] = useState("Explorateur");
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);
  const [buddyId, setBuddyId] = useState<string | null>(null);

  // Modals
  const [showBuddySelector, setShowBuddySelector] = useState(false);
  const [showAvatarBuilder, setShowAvatarBuilder] = useState(false);
  const [showNameEditor, setShowNameEditor] = useState(false);
  const [editName, setEditName] = useState("");
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);
  const [userMode, setUserMode] = useState<UserMode>("regular");
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [savaisthonDates, setSavaisthonDates] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          const stored = await AsyncStorage.multiGet([
            STORAGE_KEYS.LOGS,
            STORAGE_KEYS.POKEDEX,
            STORAGE_KEYS.BUDDY,
            STORAGE_KEYS.AVATAR_CONFIG,
            STORAGE_KEYS.USERNAME,
            STORAGE_KEYS.TRIPS,
            STORAGE_KEYS.USER_MODE,
            STORAGE_KEYS.SAVAISTHON_DATES,
          ]);
          const map = Object.fromEntries(stored) as Record<
            string,
            string | null
          >;

          const parsedLogs: Observation[] = map[STORAGE_KEYS.LOGS]
            ? JSON.parse(map[STORAGE_KEYS.LOGS]!)
            : [];
          const parsedTrips: Trip[] = map[STORAGE_KEYS.TRIPS]
            ? JSON.parse(map[STORAGE_KEYS.TRIPS]!)
            : [];

          let parsedPokedex: Animal[] = initialAnimals;
          if (map[STORAGE_KEYS.POKEDEX]) {
            const loaded = JSON.parse(map[STORAGE_KEYS.POKEDEX]!);
            parsedPokedex = initialAnimals.map((s) => {
              const found = loaded.find(
                (a: Animal) =>
                  a.name.trim().toLowerCase() === s.name.trim().toLowerCase(),
              );
              return found ? { ...s, discovered: found.discovered } : s;
            });
          }

          setLogs(parsedLogs);
          setTrips(parsedTrips);
          setPokedex(parsedPokedex);
          if (map[STORAGE_KEYS.BUDDY]) setBuddyId(map[STORAGE_KEYS.BUDDY]);
          if (map[STORAGE_KEYS.AVATAR_CONFIG])
            setAvatarConfig(JSON.parse(map[STORAGE_KEYS.AVATAR_CONFIG]!) as AvatarConfig);
          if (map[STORAGE_KEYS.USERNAME])
            setUsername(map[STORAGE_KEYS.USERNAME]!);
          if (map[STORAGE_KEYS.USER_MODE])
            setUserMode(map[STORAGE_KEYS.USER_MODE]! as UserMode);
          if (map[STORAGE_KEYS.SAVAISTHON_DATES])
            setSavaisthonDates(JSON.parse(map[STORAGE_KEYS.SAVAISTHON_DATES]!));

          calculateXp(parsedPokedex, parsedLogs, parsedTrips);
        } catch (e) {
          console.error(e);
        }
      };
      load();
    }, []),
  );

  const calculateXp = (animals: Animal[], obs: Observation[], tps: Trip[]) => {
    let xp = 0;
    animals.forEach((a) => {
      if (a.discovered) xp += a.rarity === 3 ? 500 : a.rarity === 2 ? 250 : 100;
    });
    xp += obs.length * 50;
    xp += tps.length * 200; // bonus voyages
    setUserXp(xp);
  };

  const currentRank = useMemo(() => {
    for (let i = RANKS.length - 1; i >= 0; i--)
      if (userXp >= RANKS[i].minXp) return RANKS[i];
    return RANKS[0];
  }, [userXp]);
  const nextRank = useMemo(() => {
    for (let i = 0; i < RANKS.length; i++)
      if (userXp < RANKS[i].minXp) return RANKS[i];
    return null;
  }, [userXp]);

  // --- Progression badges ---
  // Logique inlinée dans le useMemo pour stabiliser les dépendances React
  const badgesWithProgress = useMemo(
    () =>
      BADGES_CONFIG.map((b) => {
        let cur = 0;
        switch (b.kind) {
          case "obs_count":
            cur = logs.length;
            break;
          case "family":
            cur = pokedex.filter(
              (a) => a.discovered && a.family === b.family,
            ).length;
            break;
          case "countries":
            cur = new Set(
              logs.map((l) => l.location).filter((x) => x && x !== "Inconnu"),
            ).size;
            break;
          case "trip_count":
            cur = trips.length;
            break;
          case "rarity":
            cur = pokedex.filter((a) => a.discovered && a.rarity === 3).length;
            break;
          case "photos":
            cur = logs.filter((l) => l.userPhoto).length;
            break;
        }
        return { ...b, current: cur, unlocked: cur >= b.target };
      }),
    [logs, pokedex, trips],
  );

  // ===== Streak + objectifs (adaptés au mode utilisateur) =====
  const streak = useMemo(
    () => computeStreak(logs, userMode, trips, savaisthonDates),
    [logs, userMode, trips, savaisthonDates],
  );
  const goalSections = useMemo<GoalSection[]>(
    () => computeGoals(logs, pokedex, trips, userMode),
    [logs, pokedex, trips, userMode],
  );

  const handleShareProfile = async () => {
    H.tapHeavy();
    try {
      const text = buildShareText({
        username,
        rank: currentRank.name,
        xp: userXp,
        observations: logs.length,
        species: pokedex.filter((a) => a.discovered).length,
        countries: new Set(
          logs.map((l) => l.location).filter((x) => x && x !== "Inconnu"),
        ).size,
        trips: trips.length,
        streakCount: streak.count,
        streakUnit: streak.unit,
      });
      await Share.share({ message: text, title: "Mon profil MarineDex" });
    } catch {
      // L'utilisateur a annulé : on ne montre pas d'erreur
    }
  };

  const saveBuddy = async (n: string) => {
    setBuddyId(n);
    setShowBuddySelector(false);
    await AsyncStorage.setItem(STORAGE_KEYS.BUDDY, n);
    H.success();
    Alert.alert("Nouveau Compagnon !", `${n} voyage maintenant avec toi !`);
  };
  const saveAvatarConfig = async (config: AvatarConfig) => {
    setAvatarConfig(config);
    setShowAvatarBuilder(false);
    await AsyncStorage.setItem(STORAGE_KEYS.AVATAR_CONFIG, JSON.stringify(config));
  };
  const saveName = async () => {
    if (!editName.trim()) return;
    setUsername(editName.trim());
    await AsyncStorage.setItem(STORAGE_KEYS.USERNAME, editName.trim());
    setShowNameEditor(false);
    H.tapMedium();
  };

  const saveMode = async (mode: UserMode) => {
    setUserMode(mode);
    setShowModeSelector(false);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_MODE, mode);
    H.tapLight();
  };

  const buddyAnimal = buddyId ? pokedex.find((a) => a.name === buddyId) : null;

  // IDs des badges débloqués — utilisés pour les locks d'avatar
  const unlockedBadgeIds = useMemo(
    () =>
      badgesWithProgress
        .filter((b) => b.unlocked)
        .map((b) => b.id),
    [badgesWithProgress],
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        {/* Boutons Partage + Réglages en haut à droite */}
        <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.topActionBtn}
            onPress={handleShareProfile}
            accessibilityLabel="Partager mon profil"
          >
            <Text style={{ fontSize: 20 }}>📤</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.topActionBtn}
            onPress={() => router.push("/settings" as any)}
            accessibilityLabel="Réglages"
          >
            <Text style={{ fontSize: 22 }}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* HEADER */}
        <View style={styles.headerCard}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => setShowAvatarBuilder(true)}
          >
            <View style={styles.avatar}>
              <AvatarDisplay config={avatarConfig} size={86} />
            </View>
            <View style={styles.editIconBadge}>
              <Text style={{ fontSize: 10 }}>✏️</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>
                {Math.floor(userXp / 1000) + 1}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={{ marginLeft: 15, flex: 1 }}>
            <TouchableOpacity
              onPress={() => {
                setEditName(username);
                setShowNameEditor(true);
              }}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <Text style={styles.username}>{username}</Text>
              <Text style={{ marginLeft: 6, opacity: 0.4 }}>✏️</Text>
            </TouchableOpacity>
            <Text style={[styles.rankTitle, { color: currentRank.color }]}>
              {currentRank.name}
            </Text>
            {nextRank && (
              <View style={{ marginTop: 5 }}>
                <View style={styles.xpBarBg}>
                  <View
                    style={[
                      styles.xpBarFill,
                      {
                        width: `${Math.min(
                          100,
                          ((userXp - currentRank.minXp) /
                            (nextRank.minXp - currentRank.minXp)) *
                            100,
                        )}%`,
                        backgroundColor: currentRank.color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.xpText}>
                  {userXp} / {nextRank.minXp} XP
                </Text>
              </View>
            )}
            {/* Chip mode marin — tap pour changer */}
            <TouchableOpacity
              style={styles.modeChip}
              onPress={() => setShowModeSelector(true)}
            >
              <Text style={styles.modeChipText}>
                {USER_MODE_LABELS[userMode]}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <StatBox v={trips.length} l="Voyages" />
          <StatBox v={logs.length} l="Observations" />
          <StatBox v={pokedex.filter((a) => a.discovered).length} l="Espèces" />
          <StatBox
            v={
              new Set(
                logs.map((l) => l.location).filter((x) => x && x !== "Inconnu"),
              ).size
            }
            l="Pays"
          />
        </View>

        {/* STREAK + OBJECTIFS */}
        <View style={styles.streakRow}>
          <View
            style={[
              styles.streakCard,
              streak.activeThisPeriod
                ? { backgroundColor: "#FF6F00" }
                : { backgroundColor: "#90A4AE" },
            ]}
          >
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakValue}>{streak.count}</Text>
            <Text style={styles.streakLabel}>
              {streak.unit === "voyage"
                ? `voyage${streak.count > 1 ? "s" : ""} documenté${streak.count > 1 ? "s" : ""}`
                : streak.unit === "mois"
                  ? `mois d'affilée`
                  : `semaine${streak.count > 1 ? "s" : ""} d'affilée`}
            </Text>
            {/* Hint selon le mode et l'activité en cours */}
            {!streak.activeThisPeriod && streak.count > 0 && (
              <Text style={styles.streakHint}>
                {streak.unit === "voyage"
                  ? "Planifie ton prochain voyage pour continuer !"
                  : streak.unit === "mois"
                    ? "Observe avant la fin du mois pour continuer !"
                    : "Observe avant dimanche pour la garder !"}
              </Text>
            )}
            {streak.count === 0 && (
              <Text style={styles.streakHint}>
                Lance ton premier scan pour démarrer 🚀
              </Text>
            )}
          </View>
        </View>

        {/* Sections d'objectifs adaptées au mode */}
        {goalSections.map((section, si) => (
          <React.Fragment key={si}>
            <Text
              style={[
                styles.sectionTitle,
                { marginLeft: 20, marginTop: si === 0 ? 18 : 14 },
              ]}
            >
              {section.title}
            </Text>
            {section.goals.map((g, gi) => (
              <GoalRow key={gi} goal={g} />
            ))}
          </React.Fragment>
        ))}

        {/* COMPAGNON */}
        <View style={styles.buddyContainer}>
          <Text style={styles.sectionTitle}>Compagnon de Voyage</Text>
          <TouchableOpacity
            style={styles.buddyCard}
            onPress={() => setShowBuddySelector(true)}
          >
            {buddyAnimal ? (
              <>
                <Image
                  source={buddyAnimal.image}
                  style={styles.buddyImage}
                  resizeMode="contain"
                />
                <Text style={styles.buddyName}>{buddyAnimal.name}</Text>
                <Text style={styles.changeBuddyText}>Toucher pour changer</Text>
              </>
            ) : (
              <View style={{ alignItems: "center", padding: 20 }}>
                <Text style={{ fontSize: 40 }}>🥚</Text>
                <Text style={{ color: "#666", marginTop: 10 }}>
                  Choisis un compagnon
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* BADGES */}
        <Text style={[styles.sectionTitle, { marginLeft: 20, marginTop: 20 }]}>
          Badges & Succès
        </Text>
        <Text style={styles.badgeCount}>
          {badgesWithProgress.filter((b) => b.unlocked).length} /{" "}
          {badgesWithProgress.length} débloqués
        </Text>
        <View style={styles.badgeGrid}>
          {badgesWithProgress.map((b, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.badgeItem, !b.unlocked && styles.badgeLocked]}
              onPress={() => setSelectedBadge(b)}
            >
              <View
                style={[
                  styles.badgeCircle,
                  b.unlocked
                    ? { backgroundColor: "#FFD700" }
                    : { backgroundColor: "#e0e0e0" },
                ]}
              >
                <Text style={{ fontSize: 30 }}>
                  {b.unlocked ? b.icon : "🔒"}
                </Text>
              </View>
              <Text style={styles.badgeTitle} numberOfLines={2}>
                {b.title}
              </Text>
              {/* Mini barre de progression sous chaque badge */}
              <View style={styles.miniBar}>
                <View
                  style={[
                    styles.miniBarFill,
                    {
                      width: `${Math.min(100, (b.current / b.target) * 100)}%`,
                      backgroundColor: b.unlocked ? "#4CAF50" : "#FFA000",
                    },
                  ]}
                />
              </View>
              <Text style={styles.badgeProgress}>
                {b.current}/{b.target}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* À PROPOS */}
        <View style={styles.aboutSection}>
          <TouchableOpacity
            style={styles.aboutCard}
            onPress={() => router.push("/revosea")}
            activeOpacity={0.85}
          >
            <View style={styles.revoBadge}>
              <Text style={{ fontSize: 28 }}>🐬</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.revoTitle}>Revosea</Text>
              <Text style={styles.revoSub}>
                Découvrir l&apos;association partenaire
              </Text>
            </View>
            <Text style={{ fontSize: 22, color: "#006994" }}>→</Text>
          </TouchableOpacity>
        </View>

        {/* ================= MODALS ================= */}

        {/* AVATAR BUILDER */}
        <AvatarBuilder
          visible={showAvatarBuilder}
          initialConfig={avatarConfig}
          userXp={userXp}
          tripCount={trips.length}
          unlockedBadgeIds={unlockedBadgeIds}
          onSave={saveAvatarConfig}
          onClose={() => setShowAvatarBuilder(false)}
        />

        {/* PSEUDO */}
        <Modal visible={showNameEditor} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Modifier ton pseudo</Text>
              <TextInput
                style={styles.nameInput}
                value={editName}
                onChangeText={setEditName}
                maxLength={20}
              />
              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                <TouchableOpacity
                  style={[styles.closeButton, { flex: 1 }]}
                  onPress={() => setShowNameEditor(false)}
                >
                  <Text style={styles.closeButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.closeButton,
                    { flex: 1, backgroundColor: "#006994" },
                  ]}
                  onPress={saveName}
                >
                  <Text style={[styles.closeButtonText, { color: "white" }]}>
                    Enregistrer
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* BUDDY */}
        <Modal visible={showBuddySelector} animationType="slide">
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisis ton compagnon</Text>
              <TouchableOpacity onPress={() => setShowBuddySelector(false)}>
                <Text style={{ color: "red", fontWeight: "bold" }}>Fermer</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.buddyList}>
              {pokedex
                .filter((a) => a.discovered)
                .map((a) => (
                  <TouchableOpacity
                    key={a.id}
                    style={styles.buddyOption}
                    onPress={() => saveBuddy(a.name)}
                  >
                    <Image
                      source={a.image}
                      style={{ width: 60, height: 60 }}
                      resizeMode="contain"
                    />
                    <Text
                      style={{
                        textAlign: "center",
                        marginTop: 5,
                        fontWeight: "bold",
                        fontSize: 12,
                      }}
                    >
                      {a.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              {pokedex.filter((a) => a.discovered).length === 0 && (
                <View style={{ padding: 20 }}>
                  <Text
                    style={{ textAlign: "center", color: "#888", fontSize: 16 }}
                  >
                    Tu n&apos;as pas encore découvert d&apos;animal ! 🕵️‍♂️
                  </Text>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* MODE MARIN */}
        <Modal visible={showModeSelector} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Ton rythme marin</Text>
              <Text style={{ color: "#888", fontSize: 13, marginBottom: 16, textAlign: "center" }}>
                Adapte la streak et les objectifs à ta pratique
              </Text>
              {(["city", "coastal", "regular"] as UserMode[]).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.modeOption,
                    userMode === m && styles.modeOptionSelected,
                  ]}
                  onPress={() => saveMode(m)}
                >
                  <Text style={styles.modeOptionLabel}>{USER_MODE_LABELS[m]}</Text>
                  <Text style={styles.modeOptionDesc}>{USER_MODE_DESCRIPTIONS[m]}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.closeButton, { marginTop: 12 }]}
                onPress={() => setShowModeSelector(false)}
              >
                <Text style={styles.closeButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* DETAIL BADGE */}
        <Modal visible={!!selectedBadge} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {selectedBadge && (
                <>
                  <View
                    style={[
                      styles.badgeCircleLarge,
                      {
                        backgroundColor: selectedBadge.unlocked
                          ? "#FFD700"
                          : "#e0e0e0",
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 50 }}>
                      {selectedBadge.unlocked ? selectedBadge.icon : "🔒"}
                    </Text>
                  </View>
                  <Text style={styles.modalBadgeTitle}>
                    {selectedBadge.title}
                  </Text>
                  <Text style={styles.modalBadgeDesc}>
                    {selectedBadge.description}
                  </Text>
                  <View style={styles.progressContainer}>
                    <Text style={styles.progressText}>
                      Progression : {selectedBadge.current} /{" "}
                      {selectedBadge.target}
                    </Text>
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${Math.min(100, (selectedBadge.current / selectedBadge.target) * 100)}%`,
                            backgroundColor: selectedBadge.unlocked
                              ? "#4CAF50"
                              : "#FFA000",
                          },
                        ]}
                      />
                    </View>
                  </View>
                  {selectedBadge.unlocked ? (
                    <Text style={styles.unlockedText}>
                      ✨ BADGE OBTENU ! ✨
                    </Text>
                  ) : (
                    <Text style={styles.lockedText}>
                      Encore un petit effort !
                    </Text>
                  )}
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setSelectedBadge(null)}
                  >
                    <Text style={styles.closeButtonText}>Fermer</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const StatBox = ({ v, l }: { v: number; l: string }) => (
  <View style={styles.statBox}>
    <Text style={styles.statValue}>{v}</Text>
    <Text style={styles.statLabel}>{l}</Text>
  </View>
);

const GoalRow = ({
  goal,
}: {
  goal: {
    label: string;
    icon: string;
    current: number;
    target: number;
    done: boolean;
  };
}) => {
  const pct = Math.min(100, (goal.current / goal.target) * 100);
  return (
    <View style={styles.goalCard}>
      <View style={styles.goalHeader}>
        <Text style={styles.goalIcon}>{goal.icon}</Text>
        <Text style={styles.goalLabel}>{goal.label}</Text>
        <Text style={styles.goalProgress}>
          {goal.current} / {goal.target}
          {goal.done ? "  ✅" : ""}
        </Text>
      </View>
      <View style={styles.goalBarBg}>
        <View
          style={[
            styles.goalBarFill,
            {
              width: `${pct}%`,
              backgroundColor: goal.done ? "#43A047" : "#0288D1",
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f8ff",
    paddingTop: Platform.OS === "android" ? 40 : 0,
  },
  topActions: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: "row",
    gap: 8,
    zIndex: 10,
  },
  topActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
  },
  avatarContainer: { position: "relative" },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
    elevation: 5,
    backgroundColor: "#e3f2fd",
    overflow: "hidden",
  },
  editIconBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#eee",
    borderRadius: 10,
    padding: 4,
    elevation: 6,
  },
  levelBadge: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: "#006994",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
    elevation: 6,
  },
  levelText: { color: "white", fontWeight: "bold" },
  username: { fontSize: 22, fontWeight: "bold", color: "#333" },
  rankTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 5 },
  xpBarBg: {
    height: 8,
    backgroundColor: "#eee",
    borderRadius: 4,
    overflow: "hidden",
  },
  xpBarFill: { height: "100%", borderRadius: 4 },
  xpText: { fontSize: 10, color: "#888", marginTop: 2, textAlign: "right" },
  modeChip: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#e3f2fd",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  modeChipText: { fontSize: 11, color: "#006994", fontWeight: "600" },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 18,
    paddingHorizontal: 10,
    gap: 6,
  },
  statBox: {
    backgroundColor: "white",
    flex: 1,
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
    elevation: 2,
  },
  statValue: { fontSize: 18, fontWeight: "bold", color: "#006994" },
  statLabel: { fontSize: 10, color: "#666", marginTop: 2, textAlign: "center" },

  // Streak
  streakRow: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  streakCard: {
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    elevation: 3,
  },
  streakEmoji: { fontSize: 32 },
  streakValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginTop: 4,
  },
  streakLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.95)",
    fontWeight: "600",
  },
  streakHint: {
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    marginTop: 6,
    fontStyle: "italic",
    textAlign: "center",
  },

  // Goals
  goalCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    elevation: 1,
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  goalIcon: { fontSize: 18, marginRight: 8, width: 24 },
  goalLabel: { flex: 1, fontSize: 13, color: "#333", fontWeight: "600" },
  goalProgress: { fontSize: 12, color: "#666", fontWeight: "bold" },
  goalBarBg: {
    height: 6,
    backgroundColor: "#eee",
    borderRadius: 3,
    overflow: "hidden",
  },
  goalBarFill: { height: "100%", borderRadius: 3 },

  buddyContainer: { marginTop: 20, paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#006994",
    marginBottom: 10,
  },
  buddyCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 15,
    alignItems: "center",
    elevation: 4,
    minHeight: 220,
    justifyContent: "center",
  },
  buddyImage: { width: 250, height: 180, marginBottom: 10 },
  buddyName: { fontSize: 22, fontWeight: "bold", color: "#333" },
  changeBuddyText: { fontSize: 12, color: "#888", marginTop: 5 },

  badgeCount: {
    textAlign: "center",
    color: "#666",
    fontSize: 12,
    marginBottom: 8,
    fontStyle: "italic",
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  badgeItem: { width: "30%", alignItems: "center", margin: 5, padding: 8 },
  badgeLocked: { opacity: 0.65 },
  badgeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
    elevation: 2,
  },
  badgeTitle: {
    fontSize: 10,
    textAlign: "center",
    color: "#444",
    fontWeight: "bold",
    minHeight: 28,
  },
  miniBar: {
    width: "90%",
    height: 4,
    backgroundColor: "#eee",
    borderRadius: 2,
    marginTop: 4,
    overflow: "hidden",
  },
  miniBarFill: { height: "100%", borderRadius: 2 },
  badgeProgress: { fontSize: 9, color: "#888", marginTop: 2 },

  aboutSection: { marginHorizontal: 20, marginTop: 25 },
  aboutCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 14,
    borderRadius: 18,
    elevation: 3,
  },
  revoBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e3f2fd",
    justifyContent: "center",
    alignItems: "center",
  },
  revoTitle: { fontSize: 16, fontWeight: "bold", color: "#006994" },
  revoSub: { fontSize: 12, color: "#666", marginTop: 2 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    width: "85%",
    padding: 25,
    borderRadius: 20,
    alignItems: "center",
    elevation: 10,
  },
  modalHeader: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#006994",
    marginBottom: 10,
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#eee",
    borderRadius: 20,
  },
  closeButtonText: { color: "#333", fontWeight: "bold" },
  nameInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    width: "100%",
    fontSize: 16,
    textAlign: "center",
  },

  buddyList: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
    justifyContent: "space-around",
  },
  buddyOption: {
    width: "45%",
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },

  badgeCircleLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    elevation: 5,
  },
  modalBadgeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  modalBadgeDesc: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  progressContainer: { width: "100%", marginBottom: 15 },
  progressText: {
    textAlign: "center",
    marginBottom: 5,
    color: "#444",
    fontWeight: "bold",
  },
  progressBarBg: {
    height: 10,
    backgroundColor: "#eee",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", borderRadius: 5 },
  unlockedText: {
    color: "#4CAF50",
    fontWeight: "bold",
    fontSize: 18,
    marginTop: 5,
  },
  lockedText: { color: "#FFA000", fontStyle: "italic", marginTop: 5 },

  // Sélecteur de mode marin
  modeOption: {
    width: "100%",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    marginBottom: 10,
  },
  modeOptionSelected: {
    borderColor: "#006994",
    backgroundColor: "#e3f2fd",
  },
  modeOptionLabel: { fontSize: 15, fontWeight: "bold", color: "#333" },
  modeOptionDesc: { fontSize: 12, color: "#666", marginTop: 3 },
});
