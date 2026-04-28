import React from "react";
import {
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// --- DONNÉES DES INFOGRAPHIES ---
const TO_DO = [
  { icon: "📏", text: "Garder ses distances" },
  { icon: "🧴", text: 'Crème solaire "Reef Safe"' },
  { icon: "🏅", text: "Opérateurs certifiés" },
  { icon: "🚨", text: "Signaler les abus" },
  { icon: "🤫", text: "Rester discret" },
  { icon: "🗑️", text: "Rapporter ses déchets" },
];

const TO_AVOID = [
  { icon: "✋", text: "Toucher les animaux" },
  { icon: "🚧", text: "Bloquer la trajectoire" },
  { icon: "🍔", text: "Nourrir les animaux" },
  { icon: "🥾", text: "Marcher sur les coraux" },
  { icon: "📸", text: "Utiliser le flash" },
  { icon: "🐚", text: 'Rapporter des "souvenirs"' },
];

// --- DONNÉES DU BLOG GUARDIAN MAP ---
const ARTICLES = [
  {
    title: "Requins baleines : les règles d'or",
    desc: "Distances, comportements à éviter, et conseils pour une observation responsable.",
    url: "https://guardianmap.com/blog", // Remplace par l'URL exacte de l'article
    emoji: "🐋",
  },
  {
    title: "Les coraux blancs ne sont pas morts",
    desc: "Un corail blanchi est en détresse, pas forcément mort. Apprenez à le protéger.",
    url: "https://guardianmap.com/blog",
    emoji: "🪸",
  },
];

export default function ExploreScreen() {
  // Fonction pour ouvrir les liens vers ton site
  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Impossible d'ouvrir le lien", err),
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        {/* EN-TÊTE */}
        <View style={styles.header}>
          <Text style={styles.title}>🌊 Explorer & Protéger</Text>
          <Text style={styles.subtitle}>
            Notre mission : Aider chaque plongeur à faire des choix qui
            protègent l&apos;océan et ses habitants.
          </Text>
        </View>

        {/* SECTION : À FAIRE (Inspirée de ton image verte) */}
        <View style={styles.sectionContainer}>
          <View style={[styles.cardHeader, { backgroundColor: "#a8e6cf" }]}>
            <Text style={styles.cardHeaderTitle}>✅ À FAIRE</Text>
          </View>
          <View style={[styles.grid, { backgroundColor: "#f4fbf8" }]}>
            {TO_DO.map((item, index) => (
              <View key={index} style={styles.gridItem}>
                <View style={[styles.iconCircle, { borderColor: "#4CAF50" }]}>
                  <Text style={styles.iconText}>{item.icon}</Text>
                </View>
                <Text style={styles.itemText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* SECTION : À ÉVITER (Inspirée de ton image rouge) */}
        <View style={styles.sectionContainer}>
          <View style={[styles.cardHeader, { backgroundColor: "#ffcccb" }]}>
            <Text style={[styles.cardHeaderTitle, { color: "#d32f2f" }]}>
              ❌ À ÉVITER
            </Text>
          </View>
          <View style={[styles.grid, { backgroundColor: "#fff5f5" }]}>
            {TO_AVOID.map((item, index) => (
              <View key={index} style={styles.gridItem}>
                <View style={[styles.iconCircle, { borderColor: "#d32f2f" }]}>
                  <Text style={styles.iconText}>{item.icon}</Text>
                  {/* Petit panneau interdit par dessus l'icône pour le style */}
                  <Text style={styles.forbiddenOverlay}>🚫</Text>
                </View>
                <Text style={styles.itemText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* SECTION : ARTICLES GUARDIAN MAP */}
        <View style={styles.articlesContainer}>
          <Text style={styles.sectionTitle}>
            Comprendre pour mieux protéger
          </Text>
          <Text style={styles.sectionDesc}>
            Découvre les articles de GuardianMap
          </Text>

          {ARTICLES.map((article, index) => (
            <TouchableOpacity
              key={index}
              style={styles.articleCard}
              onPress={() => openLink(article.url)}
              activeOpacity={0.7}
            >
              <Text style={styles.articleEmoji}>{article.emoji}</Text>
              <View style={styles.articleTextContainer}>
                <Text style={styles.articleTitle}>{article.title}</Text>
                <Text style={styles.articleDesc}>{article.desc}</Text>
              </View>
              <Text style={styles.arrowIcon}>→</Text>
            </TouchableOpacity>
          ))}

          {/* BOUTON VERS LE SITE WEB */}
          <TouchableOpacity
            style={styles.websiteButton}
            onPress={() => openLink("https://guardianmap.com")}
          >
            <Text style={styles.websiteButtonText}>
              🌍 Visiter GuardianMap.com
            </Text>
          </TouchableOpacity>
        </View>
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
  header: {
    padding: 20,
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#006994",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 22,
  },

  // Conteneurs des sections (À faire / À éviter)
  sectionContainer: {
    marginHorizontal: 15,
    marginBottom: 25,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: "white",
  },
  cardHeader: {
    paddingVertical: 12,
    alignItems: "center",
  },
  cardHeaderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2e7d32", // Sera écrasé pour le rouge
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 15,
  },
  gridItem: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingRight: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    marginRight: 10,
    position: "relative",
  },
  iconText: {
    fontSize: 20,
  },
  forbiddenOverlay: {
    position: "absolute",
    fontSize: 48,
    opacity: 0.7,
    color: "red",
  },
  itemText: {
    flex: 1,
    fontSize: 13,
    color: "#333",
    fontWeight: "600",
  },

  // Section Blog / Guardian Map
  articlesContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#006994",
  },
  sectionDesc: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  articleCard: {
    flexDirection: "row",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  articleEmoji: {
    fontSize: 30,
    marginRight: 15,
  },
  articleTextContainer: {
    flex: 1,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  articleDesc: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },
  arrowIcon: {
    fontSize: 20,
    color: "#006994",
    marginLeft: 10,
  },
  websiteButton: {
    backgroundColor: "#006994",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  websiteButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
