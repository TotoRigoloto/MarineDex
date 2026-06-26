// Écran Réglages : compte, sync, export, légal, reset.
// Tous les outils dont l'utilisateur peut avoir besoin pour gérer ses données.
import { STORAGE_KEYS } from "@/constants/Storage";
import { signOut, useAuth } from "@/services/auth";
import { supabase } from "@/services/supabase";
import { syncAll } from "@/services/sync";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface RowProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
}

const Row = ({ icon, label, value, onPress, rightElement, destructive }: RowProps) => (
  <TouchableOpacity
    style={styles.row}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.6 : 1}
  >
    <Text style={styles.rowIcon}>{icon}</Text>
    <View style={{ flex: 1 }}>
      <Text style={[styles.rowLabel, destructive && { color: "#dc3545" }]}>{label}</Text>
      {value !== undefined && <Text style={styles.rowValue}>{value}</Text>}
    </View>
    {rightElement ?? (onPress ? <Text style={styles.rowChevron}>›</Text> : null)}
  </TouchableOpacity>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.card}>{children}</View>
  </View>
);

export default function SettingsScreen() {
  const { user, session } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(false);

  useEffect(() => {
    const load = async () => {
      const stored = await AsyncStorage.multiGet([
        STORAGE_KEYS.USERNAME,
        STORAGE_KEYS.USER_EMAIL,
        STORAGE_KEYS.LAST_SYNC_AT,
        STORAGE_KEYS.NOTIFICATIONS_ENABLED,
      ]);
      const map = Object.fromEntries(stored) as Record<string, string | null>;
      if (map[STORAGE_KEYS.USERNAME]) setUsername(map[STORAGE_KEYS.USERNAME]!);
      if (map[STORAGE_KEYS.USER_EMAIL] || user?.email)
        setEmail(map[STORAGE_KEYS.USER_EMAIL] || user?.email || "");
      if (map[STORAGE_KEYS.LAST_SYNC_AT]) setLastSync(map[STORAGE_KEYS.LAST_SYNC_AT]);
      setNotifications(map[STORAGE_KEYS.NOTIFICATIONS_ENABLED] === "true");
    };
    load();
  }, [user]);

  const handleSync = async () => {
    if (!user) {
      Alert.alert(
        "Mode local",
        "Tu es en mode hors-ligne. Crée un compte pour synchroniser tes données.",
        [
          { text: "Plus tard", style: "cancel" },
          {
            text: "Créer un compte",
            onPress: async () => {
              await signOut();
              router.replace("/login");
            },
          },
        ],
      );
      return;
    }
    setSyncing(true);
    const r = await syncAll();
    setSyncing(false);
    if (r.ok) {
      const now = new Date().toLocaleString();
      setLastSync(now);
      Alert.alert(
        "Sync terminée ✓",
        `Envoyés : ${r.pushedTrips} voyages, ${r.pushedDives} plongées, ${r.pushedObs} obs, ${r.pushedPokedex} espèces.\nReçus : ${r.pulledTrips} voyages, ${r.pulledDives} plongées, ${r.pulledObs} obs, ${r.pulledPokedex} espèces.`,
      );
    } else {
      Alert.alert("Erreur de sync", r.error ?? "Inconnue");
    }
  };

  const handleExport = async () => {
    try {
      const stored = await AsyncStorage.multiGet([
        STORAGE_KEYS.LOGS,
        STORAGE_KEYS.TRIPS,
        STORAGE_KEYS.POKEDEX,
        STORAGE_KEYS.USERNAME,
        STORAGE_KEYS.AVATAR_ID,
      ]);
      const data = Object.fromEntries(stored.map(([k, v]) => [k, v ? JSON.parse(v) : null]));
      const json = JSON.stringify(
        { exportedAt: new Date().toISOString(), data },
        null,
        2,
      );
      const path = `${FileSystem.cacheDirectory}marinedex-export-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(path, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      // Share natif RN : sur iOS on partage l'URL fichier, sur Android
      // on partage le texte (la sheet de partage natif gère la suite).
      try {
        if (Platform.OS === "ios") {
          await Share.share({ url: path, title: "Export MarineDex" });
        } else {
          await Share.share({
            title: "Export MarineDex",
            message: `Sauvegarde MarineDex (${new Date().toLocaleString()})\n\n${json.slice(0, 5000)}${json.length > 5000 ? "\n…(tronqué)" : ""}`,
          });
        }
      } catch {
        Alert.alert("Export prêt", `Fichier sauvegardé sur l'appareil :\n${path}`);
      }
    } catch (e: any) {
      Alert.alert("Erreur export", e?.message ?? "");
    }
  };

  const handleLogout = async () => {
    Alert.alert("Déconnexion", "Tes données locales seront conservées.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Se déconnecter",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem(STORAGE_KEYS.HAS_ACCOUNT);
          await signOut();
          router.replace("/login");
        },
      },
    ]);
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Supprimer le compte",
      "Cette action est irréversible. Toutes tes données (cloud + local) seront effacées.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Tout supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              if (user) {
                await supabase.from("md_profiles").delete().eq("id", user.id);
              }
              await AsyncStorage.multiRemove([
                STORAGE_KEYS.POKEDEX,
                STORAGE_KEYS.LOGS,
                STORAGE_KEYS.TRIPS,
                STORAGE_KEYS.BUDDY,
                STORAGE_KEYS.AVATAR_COLOR,
                STORAGE_KEYS.AVATAR_ID,
                STORAGE_KEYS.USERNAME,
                STORAGE_KEYS.USER_EMAIL,
                STORAGE_KEYS.USER_CREATED_AT,
                STORAGE_KEYS.ONBOARDING_DONE,
                STORAGE_KEYS.HAS_ACCOUNT,
                STORAGE_KEYS.LAST_SYNC_AT,
                STORAGE_KEYS.NOTIFICATIONS_ENABLED,
              ]);
              await signOut();
              router.replace("/login");
            } catch (e: any) {
              Alert.alert("Erreur", e?.message ?? "Impossible de supprimer");
            }
          },
        },
      ],
    );
  };

  const handleDevReset = async () => {
    Alert.alert(
      "DEV — Reset complet",
      "Efface TOUT (local). Ne touche pas au cloud. Relance l'app après.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            const keys = await AsyncStorage.getAllKeys();
            await AsyncStorage.multiRemove(keys);
            Alert.alert("OK", "Relance l'app");
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Réglages</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Section title="Compte">
          <Row icon="👤" label="Pseudo" value={username || "—"} />
          <Row
            icon="📧"
            label="Email"
            value={email || "Non renseigné"}
          />
          <Row
            icon="☁️"
            label={session ? "Synchronisation cloud" : "Mode local"}
            value={
              session
                ? lastSync
                  ? `Dernière : ${lastSync}`
                  : "Jamais"
                : "Crée un compte pour activer"
            }
          />
        </Section>

        <Section title="Synchronisation">
          <Row
            icon="🔄"
            label={syncing ? "Synchronisation…" : "Synchroniser maintenant"}
            onPress={syncing ? undefined : handleSync}
            rightElement={syncing ? <ActivityIndicator color="#006994" /> : undefined}
          />
          <Row icon="📤" label="Exporter mes données (JSON)" onPress={handleExport} />
        </Section>

        <Section title="Préférences">
          <Row
            icon="🔔"
            label="Notifications"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={async (v) => {
                  setNotifications(v);
                  await AsyncStorage.setItem(
                    STORAGE_KEYS.NOTIFICATIONS_ENABLED,
                    String(v),
                  );
                }}
                trackColor={{ false: "#ccc", true: "#006994" }}
              />
            }
          />
        </Section>

        <Section title="À propos">
          <Row icon="ℹ️" label="À propos" onPress={() => router.push("/legal/about" as any)} />
          <Row icon="🔒" label="Confidentialité" onPress={() => router.push("/legal/privacy" as any)} />
          <Row icon="📋" label="Conditions d'utilisation" onPress={() => router.push("/legal/terms" as any)} />
          <Row icon="🐬" label="L'association Revosea" onPress={() => router.push("/revosea" as any)} />
        </Section>

        <Section title="Zone de danger">
          {session && (
            <Row icon="🚪" label="Se déconnecter" onPress={handleLogout} destructive />
          )}
          <Row icon="🗑️" label="Supprimer mon compte" onPress={handleDeleteAccount} destructive />
        </Section>

        {/* DEV ZONE — visible uniquement en développement, jamais en production store */}
        {__DEV__ && (
          <Section title="🛠️ Développeur (caché en prod)">
            <Row icon="🧹" label="Reset complet AsyncStorage" onPress={handleDevReset} destructive />
          </Section>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

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

  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#666",
    marginLeft: 16,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  rowIcon: { fontSize: 20, marginRight: 14, width: 24, textAlign: "center" },
  rowLabel: { fontSize: 15, color: "#333" },
  rowValue: { fontSize: 12, color: "#888", marginTop: 2 },
  rowChevron: { fontSize: 22, color: "#ccc", marginLeft: 10 },
});
