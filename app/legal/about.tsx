// Page À propos — infos de l'app, équipe, technologies, licences.
import Constants from "expo-constants";
import { router } from "expo-router";
import React from "react";
import { Linking, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AboutScreen() {
  const version = Constants.expoConfig?.version ?? "1.0.0";
  const buildNumber =
    Constants.expoConfig?.ios?.buildNumber ??
    Constants.expoConfig?.android?.versionCode?.toString() ??
    "—";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>À propos</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <View style={styles.logo}>
            <Text style={{ fontSize: 50 }}>🌊</Text>
          </View>
          <Text style={styles.appName}>MarineDex</Text>
          <Text style={styles.tagline}>
            Explorez. Identifiez. Protégez.
          </Text>
          <Text style={styles.version}>
            Version {version} (build {buildNumber})
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notre mission</Text>
          <Text style={styles.body}>
            MarineDex est l&apos;application compagnon de l&apos;association{" "}
            <Text style={styles.strong}>Revosea</Text>, qui œuvre pour la
            préservation des écosystèmes marins. Chaque observation que vous
            enregistrez contribue à mieux comprendre la biodiversité marine.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Technologies</Text>
          <Bullet>React Native + Expo</Bullet>
          <Bullet>Supabase (auth, base de données, stockage)</Bullet>
          <Bullet>TensorFlow / Keras pour l&apos;identification IA</Bullet>
          <Bullet>react-native-maps pour la cartographie</Bullet>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Crédits</Text>
          <Bullet>Données aires marines protégées : Revosea</Bullet>
          <Bullet>Encyclopédie marine : équipe Revosea</Bullet>
          <Bullet>Illustrations : projet MarineDex</Bullet>
        </View>

        <TouchableOpacity
          style={styles.linkCard}
          onPress={() => Linking.openURL("https://revosea.com").catch(() => {})}
        >
          <Text style={styles.linkIcon}>🐬</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>Découvrir Revosea</Text>
            <Text style={styles.linkSub}>revosea.com</Text>
          </View>
          <Text style={{ color: "#006994", fontSize: 22 }}>→</Text>
        </TouchableOpacity>

        <Text style={styles.copyright}>
          © {new Date().getFullYear()} Revosea — Tous droits réservés.{"\n"}
          Fait avec ❤️ pour les océans.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.bullet}>• {children}</Text>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f8ff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "white",
    elevation: 2,
  },
  back: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  backTxt: { fontSize: 22, color: "#006994", fontWeight: "bold" },
  headerTitle: { flex: 1, textAlign: "center", fontWeight: "bold", color: "#006994", fontSize: 17 },
  scroll: { padding: 20, paddingBottom: 40 },
  hero: { alignItems: "center", marginBottom: 20 },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#006994",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    elevation: 4,
  },
  appName: { fontSize: 28, fontWeight: "bold", color: "#006994", letterSpacing: 1 },
  tagline: { fontSize: 14, color: "#666", fontStyle: "italic", marginTop: 4 },
  version: { fontSize: 12, color: "#888", marginTop: 8 },
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: "#006994", marginBottom: 8 },
  body: { fontSize: 14, color: "#333", lineHeight: 22 },
  bullet: { fontSize: 14, color: "#444", lineHeight: 24 },
  strong: { fontWeight: "bold", color: "#006994" },
  linkCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 14,
    borderRadius: 14,
    elevation: 2,
    marginTop: 4,
  },
  linkIcon: { fontSize: 28, marginRight: 12 },
  linkTitle: { fontSize: 15, fontWeight: "bold", color: "#006994" },
  linkSub: { fontSize: 12, color: "#666", marginTop: 2 },
  copyright: {
    fontSize: 11,
    color: "#888",
    textAlign: "center",
    marginTop: 24,
    lineHeight: 18,
  },
});
