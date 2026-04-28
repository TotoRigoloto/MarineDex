import { Animal, initialAnimals, Observation } from "@/constants/MarineData";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    Alert,
    Image,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// --- CONFIGURATION DU JEU ---
const RANKS = [
  { name: "Baigneur", minXp: 0, color: "#81D4FA" },
  { name: "Plongeur Open Water", minXp: 500, color: "#4FC3F7" },
  { name: "Explorateur", minXp: 1500, color: "#29B6F6" },
  { name: "Dive Master", minXp: 3000, color: "#039BE5" },
  { name: "Commandant", minXp: 5000, color: "#0277BD" },
  { name: "Légende des Océans", minXp: 10000, color: "#01579B" },
];

const BADGES_CONFIG = [
  {
    id: "shark_lover",
    title: "Grand Requin",
    description: "Découvre des animaux de la famille Requin",
    family: "Requin",
    count: 3,
    icon: "🦈",
  },
  {
    id: "whale_watcher",
    title: "Ami des Géants",
    description: "Découvre des Cétacés (Baleines, Dauphins...)",
    family: "Cétacé",
    count: 3,
    icon: "🐋",
  },
  {
    id: "turtle_fan",
    title: "Carapace",
    description: "Observe différentes espèces de Tortues",
    family: "Tortue",
    count: 2,
    icon: "🐢",
  },
  {
    id: "ray_rider",
    title: "Ailes de Mer",
    description: "Croise le chemin des Raies",
    family: "Raie",
    count: 2,
    icon: "🪁",
  },
  {
    id: "fish_expert",
    title: "Ichtyologue",
    description: "Identifie 5 poissons différents",
    family: "Poisson",
    count: 5,
    icon: "🐠",
  },
  {
    id: "globetrotter",
    title: "Globetrotter",
    description: "Visite 3 pays différents",
    type: "continents",
    count: 3,
    icon: "🌍",
  },
];

// Styles d'avatars prédéfinis (Alternative simple à la création 3D)
const AVATAR_STYLES = [
  { id: "blue", color: "#006994", label: "Bleu Profond" },
  { id: "red", color: "#E53935", label: "Rouge Alerte" },
  { id: "green", color: "#43A047", label: "Algues" },
  { id: "yellow", color: "#FDD835", label: "Sous-marin" },
  { id: "pink", color: "#E91E63", label: "Corail" },
  { id: "black", color: "#333333", label: "Combinaison Pro" },
];

export default function ProfileScreen() {
  // Données
  const [userXp, setUserXp] = useState(0);
  const [logs, setLogs] = useState<Observation[]>([]);
  const [pokedex, setPokedex] = useState<Animal[]>(initialAnimals);
  const [buddyId, setBuddyId] = useState<string | null>(null);
  const [avatarColor, setAvatarColor] = useState("#006994"); // Couleur par défaut

  // Modals
  const [showBuddySelector, setShowBuddySelector] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, []),
  );

  const loadProfileData = async () => {
    try {
      const savedLogs = await AsyncStorage.getItem("user_logs");
      const savedPokedex = await AsyncStorage.getItem("pokedex_save");
      const savedBuddy = await AsyncStorage.getItem("user_buddy");
      const savedAvatar = await AsyncStorage.getItem("user_avatar_color");

      const parsedLogs: Observation[] = savedLogs ? JSON.parse(savedLogs) : [];

      // Reconstitution du Pokedex
      let parsedPokedex: Animal[] = initialAnimals;
      if (savedPokedex) {
        const loadedData = JSON.parse(savedPokedex);
        parsedPokedex = initialAnimals.map((staticA) => {
          const savedA = loadedData.find(
            (a: Animal) => a.name === staticA.name,
          );
          return savedA
            ? { ...staticA, discovered: savedA.discovered }
            : staticA;
        });
      }

      setLogs(parsedLogs);
      setPokedex(parsedPokedex);
      if (savedBuddy) setBuddyId(savedBuddy);
      if (savedAvatar) setAvatarColor(savedAvatar);

      calculateXp(parsedPokedex, parsedLogs);
    } catch (e) {
      console.error(e);
    }
  };

  const calculateXp = (animals: Animal[], observations: Observation[]) => {
    let xp = 0;
    animals.forEach((anim) => {
      if (anim.discovered) {
        xp += anim.rarity === 3 ? 500 : anim.rarity === 2 ? 250 : 100;
      }
    });
    xp += observations.length * 50;
    setUserXp(xp);
  };

  const getCurrentRank = () => {
    for (let i = RANKS.length - 1; i >= 0; i--) {
      if (userXp >= RANKS[i].minXp) return RANKS[i];
    }
    return RANKS[0];
  };

  const getNextRank = () => {
    for (let i = 0; i < RANKS.length; i++) {
      if (userXp < RANKS[i].minXp) return RANKS[i];
    }
    return null;
  };

  // --- LOGIQUE BADGES (Calcul de la progression) ---
  const getBadgeProgress = (badge: any) => {
    if (badge.type === "continents") {
      const uniqueLocations = new Set(logs.map((l) => l.location)).size;
      return {
        current: uniqueLocations,
        target: badge.count,
        unlocked: uniqueLocations >= badge.count,
      };
    } else {
      const count = pokedex.filter(
        (a) => a.discovered && a.family === badge.family,
      ).length;
      return {
        current: count,
        target: badge.count,
        unlocked: count >= badge.count,
      };
    }
  };

  // --- ACTIONS ---
  const saveBuddy = async (animalName: string) => {
    setBuddyId(animalName);
    setShowBuddySelector(false);
    await AsyncStorage.setItem("user_buddy", animalName);
    Alert.alert(
      "Nouveau Compagnon !",
      `${animalName} voyage maintenant avec toi !`,
    );
  };

  const saveAvatar = async (color: string) => {
    setAvatarColor(color);
    setShowAvatarSelector(false);
    await AsyncStorage.setItem("user_avatar_color", color);
  };

  // Récupération de l'objet Animal complet pour le Buddy
  const buddyAnimal = buddyId ? pokedex.find((a) => a.name === buddyId) : null;
  const currentRank = getCurrentRank();
  const nextRank = getNextRank();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        {/* --- EN-TÊTE : AVATAR & GRADE --- */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => setShowAvatarSelector(true)}
          >
            {/* Avatar simulé par une View colorée et une lettre */}
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
              <Text style={{ fontSize: 30 }}>🤿</Text>
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
            <Text style={styles.username}>Explorateur</Text>
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
                        width: `${Math.min(100, ((userXp - currentRank.minXp) / (nextRank.minXp - currentRank.minXp)) * 100)}%`,
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
          </View>
        </View>

        {/* --- COMPAGNON DE VOYAGE --- */}
        <View style={styles.buddyContainer}>
          <Text style={styles.sectionTitle}>Compagnon de Voyage</Text>
          <TouchableOpacity
            style={styles.buddyCard}
            onPress={() => setShowBuddySelector(true)}
          >
            {buddyAnimal ? (
              <>
                {/* Correction Image : resizeMode contain évite le carré blanc ou zoomé */}
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

        {/* --- STATISTIQUES --- */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{logs.length}</Text>
            <Text style={styles.statLabel}>Observations</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {pokedex.filter((a) => a.discovered).length}
            </Text>
            <Text style={styles.statLabel}>Découvertes</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {new Set(logs.map((l) => l.location)).size}
            </Text>
            <Text style={styles.statLabel}>Pays</Text>
          </View>
        </View>

        {/* --- BADGES --- */}
        <Text style={[styles.sectionTitle, { marginLeft: 20, marginTop: 20 }]}>
          Badges & Succès
        </Text>
        <View style={styles.badgeGrid}>
          {BADGES_CONFIG.map((badge, index) => {
            const progress = getBadgeProgress(badge);
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.badgeItem,
                  !progress.unlocked && styles.badgeLocked,
                ]}
                onPress={() => setSelectedBadge({ ...badge, ...progress })}
              >
                <View
                  style={[
                    styles.badgeCircle,
                    progress.unlocked
                      ? { backgroundColor: "#FFD700" }
                      : { backgroundColor: "#e0e0e0" },
                  ]}
                >
                  <Text style={{ fontSize: 30 }}>
                    {progress.unlocked ? badge.icon : "🔒"}
                  </Text>
                </View>
                <Text style={styles.badgeTitle}>{badge.title}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ================= MODALS ================= */}

        {/* 1. SÉLECTEUR BUDDY */}
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
                .map((animal) => (
                  <TouchableOpacity
                    key={animal.id}
                    style={styles.buddyOption}
                    onPress={() => saveBuddy(animal.name)}
                  >
                    <Image
                      source={animal.image}
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
                      {animal.name}
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
                  <Text
                    style={{
                      textAlign: "center",
                      color: "#888",
                      marginTop: 10,
                    }}
                  >
                    Utilise le Scanner ou le Journal pour débloquer des
                    compagnons.
                  </Text>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* 2. SÉLECTEUR AVATAR (Personnalisation Simple) */}
        <Modal
          visible={showAvatarSelector}
          animationType="fade"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Personnalise ton Plongeur</Text>
              <Text
                style={{ textAlign: "center", marginBottom: 15, color: "#666" }}
              >
                Choisis la couleur de ta combinaison
              </Text>

              <View style={styles.avatarGrid}>
                {AVATAR_STYLES.map((style) => (
                  <TouchableOpacity
                    key={style.id}
                    style={[
                      styles.avatarOption,
                      { backgroundColor: style.color },
                      avatarColor === style.color && styles.avatarSelected,
                    ]}
                    onPress={() => saveAvatar(style.color)}
                  >
                    <Text style={{ fontSize: 24 }}>🤿</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAvatarSelector(false)}
              >
                <Text style={styles.closeButtonText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* 3. DÉTAILS BADGE */}
        <Modal
          visible={!!selectedBadge}
          animationType="fade"
          transparent={true}
        >
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f8ff",
    paddingTop: Platform.OS === "android" ? 40 : 0,
  },

  // Header
  header: {
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
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
    elevation: 5,
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
  username: { fontSize: 20, fontWeight: "bold", color: "#333" },
  rankTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
  xpBarBg: {
    height: 8,
    backgroundColor: "#eee",
    borderRadius: 4,
    overflow: "hidden",
  },
  xpBarFill: { height: "100%", borderRadius: 4 },
  xpText: { fontSize: 10, color: "#888", marginTop: 2, textAlign: "right" },

  // Buddy
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
  buddyImage: { width: 250, height: 180, marginBottom: 10 }, // Taille ajustée
  buddyName: { fontSize: 22, fontWeight: "bold", color: "#333" },
  changeBuddyText: { fontSize: 12, color: "#888", marginTop: 5 },

  // Stats
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    paddingHorizontal: 10,
  },
  statBox: {
    backgroundColor: "white",
    width: "30%",
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    elevation: 2,
  },
  statValue: { fontSize: 20, fontWeight: "bold", color: "#006994" },
  statLabel: { fontSize: 12, color: "#666" },

  // Badges
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  badgeItem: { width: "30%", alignItems: "center", margin: 5, padding: 10 },
  badgeLocked: { opacity: 0.6 },
  badgeCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
    elevation: 2,
  },
  badgeTitle: {
    fontSize: 11,
    textAlign: "center",
    color: "#444",
    fontWeight: "bold",
  },

  // Modals Communs
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

  // Modal Avatar
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 15,
  },
  avatarOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  avatarSelected: { borderWidth: 3, borderColor: "#000" },

  // Modal Buddy
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

  // Modal Badge Detail
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
});
