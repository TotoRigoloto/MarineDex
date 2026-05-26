// Écran d'inscription / connexion local au premier lancement.
// Stocke pseudo + email + avatar dans AsyncStorage.
// Pas de mot de passe : c'est juste un profil local pour l'instant.
// (Branchable plus tard sur Supabase, déjà installé dans les deps.)
import { AVATAR_PRESETS, getAvatarById, STORAGE_KEYS } from "@/constants/Storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { height } = Dimensions.get("window");

export default function LoginScreen() {
  const [step, setStep] = useState<"welcome" | "form">("welcome");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatarId, setAvatarId] = useState<string>(AVATAR_PRESETS[0].id);
  const [error, setError] = useState<string | null>(null);

  // Animation d'entrée
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [step, fadeAnim, slideAnim]);

  const validate = () => {
    if (!username.trim()) {
      setError("Choisis un pseudo de plongeur 🤿");
      return false;
    }
    if (username.trim().length < 2) {
      setError("Pseudo trop court");
      return false;
    }
    // Email optionnel mais vérifié si rempli
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Email invalide");
      return false;
    }
    setError(null);
    return true;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.USERNAME, username.trim()],
        [STORAGE_KEYS.USER_EMAIL, email.trim()],
        [STORAGE_KEYS.AVATAR_ID, avatarId],
        [STORAGE_KEYS.USER_CREATED_AT, String(Date.now())],
        [STORAGE_KEYS.HAS_ACCOUNT, "true"],
        [STORAGE_KEYS.ONBOARDING_DONE, "true"],
      ]);
      router.replace("/(tabs)");
    } catch (e) {
      setError("Impossible de créer ton profil.");
    }
  };

  const selectedAvatar = getAvatarById(avatarId);

  return (
    <SafeAreaView style={styles.container}>
      {/* Fond dégradé bleu marine */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "#001a2c" }]} />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "#006994", opacity: 0.5, top: height * 0.5 },
        ]}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {step === "welcome" ? (
            <Animated.View
              style={[
                styles.center,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              <View style={styles.logoCircle}>
                <Text style={{ fontSize: 70 }}>🌊</Text>
              </View>
              <Text style={styles.appName}>MarineDex</Text>
              <Text style={styles.tagline}>Ton carnet d&apos;exploration des océans</Text>

              <View style={styles.featuresList}>
                <Feature emoji="📸" text="Scanne et identifie les espèces marines" />
                <Feature emoji="📔" text="Construis ton journal de voyages" />
                <Feature emoji="🗺️" text="Cartographie tes observations" />
                <Feature emoji="🏆" text="Débloque badges et compagnons" />
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setStep("form")}
              >
                <Text style={styles.primaryButtonText}>Commencer l&apos;aventure</Text>
              </TouchableOpacity>
              <Text style={styles.legal}>
                Aucun compte cloud requis. Tes données restent sur ton appareil.
              </Text>
            </Animated.View>
          ) : (
            <Animated.View
              style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
            >
              <Text style={styles.title}>Crée ton profil de plongeur</Text>
              <Text style={styles.subtitle}>Tu pourras le modifier plus tard.</Text>

              {/* Aperçu de l'avatar sélectionné */}
              <View style={styles.previewWrap}>
                <View
                  style={[styles.previewAvatar, { backgroundColor: selectedAvatar.bg }]}
                >
                  <Text style={{ fontSize: 50 }}>{selectedAvatar.emoji}</Text>
                </View>
                <Text style={styles.previewLabel}>{selectedAvatar.label}</Text>
              </View>

              {/* Grille d'avatars */}
              <Text style={styles.fieldLabel}>Choisis ton avatar</Text>
              <View style={styles.avatarGrid}>
                {AVATAR_PRESETS.map((a) => (
                  <TouchableOpacity
                    key={a.id}
                    style={[
                      styles.avatarOption,
                      { backgroundColor: a.bg },
                      avatarId === a.id && styles.avatarSelected,
                    ]}
                    onPress={() => setAvatarId(a.id)}
                  >
                    <Text style={{ fontSize: 26 }}>{a.emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Ton pseudo *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: CaptainBlue"
                placeholderTextColor="#88a"
                value={username}
                onChangeText={setUsername}
                maxLength={20}
                returnKeyType="next"
              />

              <Text style={styles.fieldLabel}>Email (optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="pour synchroniser plus tard"
                placeholderTextColor="#88a"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="done"
              />

              {error && <Text style={styles.error}>⚠️ {error}</Text>}

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleCreate}
              >
                <Text style={styles.primaryButtonText}>Plonger 🚀</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setStep("welcome")}>
                <Text style={styles.backLink}>← Retour</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const Feature = ({ emoji, text }: { emoji: string; text: string }) => (
  <View style={styles.featureRow}>
    <Text style={styles.featureEmoji}>{emoji}</Text>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#001a2c" },
  scrollContent: { padding: 25, paddingTop: 60, paddingBottom: 40 },
  center: { alignItems: "center" },

  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    marginBottom: 20,
  },
  appName: {
    fontSize: 36,
    fontWeight: "bold",
    color: "white",
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
    marginTop: 8,
    fontStyle: "italic",
    marginBottom: 30,
    textAlign: "center",
  },

  featuresList: {
    width: "100%",
    marginVertical: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  featureEmoji: { fontSize: 22, width: 36 },
  featureText: { color: "white", fontSize: 14, flex: 1 },

  primaryButton: {
    backgroundColor: "#FFB300",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 20,
    elevation: 5,
    alignSelf: "stretch",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#01304a",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  legal: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    marginTop: 15,
    textAlign: "center",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginBottom: 20,
  },
  previewWrap: { alignItems: "center", marginBottom: 20 },
  previewAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.4)",
  },
  previewLabel: {
    color: "white",
    marginTop: 8,
    fontWeight: "bold",
  },

  fieldLabel: {
    color: "white",
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 8,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    marginBottom: 10,
  },
  avatarOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  avatarSelected: { borderColor: "#FFB300", borderWidth: 3 },

  input: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "white",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  error: {
    color: "#FFCDD2",
    marginTop: 10,
    textAlign: "center",
    fontWeight: "bold",
  },
  backLink: {
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
  },
});
