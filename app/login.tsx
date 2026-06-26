// Écran Auth : inscription (email+password+pseudo+avatar) OU connexion.
// Mode hors-ligne : on garde la possibilité de "continuer sans compte" pour
// tester l'app et migrer plus tard les données vers un compte cloud.
import { AVATAR_PRESETS, getAvatarById, STORAGE_KEYS } from "@/constants/Storage";
import { signIn, signUp } from "@/services/auth";
import * as H from "@/services/haptics";
import {
  USER_MODE_DESCRIPTIONS,
  USER_MODE_LABELS,
  UserMode,
} from "@/services/stats";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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

type Step = "welcome" | "signup" | "signin" | "mode";

// Emojis et labels affichés dans les cartes de sélection de mode
const MODE_CARDS: { mode: UserMode; emoji: string }[] = [
  { mode: "city",    emoji: "🏙️" },
  { mode: "coastal", emoji: "🏖️" },
  { mode: "regular", emoji: "🌊" },
];

export default function LoginScreen() {
  const [step, setStep] = useState<Step>("welcome");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatarId, setAvatarId] = useState<string>(AVATAR_PRESETS[0].id);
  const [selectedMode, setSelectedMode] = useState<UserMode>("regular");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(40);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [step, fadeAnim, slideAnim]);

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const handleSignup = async () => {
    setError(null);
    setInfo(null);
    if (username.trim().length < 2) return setError("Pseudo trop court (min 2)");
    if (!isValidEmail(email)) return setError("Email invalide");
    if (password.length < 8) return setError("Mot de passe : 8 caractères minimum");

    setLoading(true);
    try {
      const data = await signUp(email, password, {
        username: username.trim(),
        avatar_id: avatarId,
      });

      // On stocke les infos locales (utilisées par les écrans même hors-ligne)
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.USERNAME, username.trim()],
        [STORAGE_KEYS.USER_EMAIL, email.trim()],
        [STORAGE_KEYS.AVATAR_ID, avatarId],
        [STORAGE_KEYS.USER_CREATED_AT, String(Date.now())],
        [STORAGE_KEYS.HAS_ACCOUNT, "true"],
        [STORAGE_KEYS.ONBOARDING_DONE, "true"],
      ]);

      if (data.session) {
        H.success();
        setStep("mode");
      } else {
        H.tapMedium();
        setInfo(
          "Compte créé ! Vérifie tes emails pour valider, puis reviens te connecter.",
        );
        setStep("signin");
      }
    } catch (e: any) {
      H.error();
      setError(e?.message ?? "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  const handleSignin = async () => {
    setError(null);
    setInfo(null);
    if (!isValidEmail(email)) return setError("Email invalide");
    if (password.length < 1) return setError("Mot de passe requis");

    setLoading(true);
    try {
      await signIn(email, password);
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.USER_EMAIL, email.trim()],
        [STORAGE_KEYS.HAS_ACCOUNT, "true"],
        [STORAGE_KEYS.ONBOARDING_DONE, "true"],
      ]);
      H.success();
      router.replace("/(tabs)");
    } catch (e: any) {
      H.error();
      setError(e?.message ?? "Identifiants incorrects");
    } finally {
      setLoading(false);
    }
  };

  // Mode "essayer sans compte" : crée un profil local seulement (pas de cloud).
  // Utile pour la review store et pour tester avant de s'engager.
  const continueOffline = async () => {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.USERNAME, "Explorateur"],
      [STORAGE_KEYS.AVATAR_ID, AVATAR_PRESETS[0].id],
      [STORAGE_KEYS.USER_CREATED_AT, String(Date.now())],
      [STORAGE_KEYS.HAS_ACCOUNT, "true"],
      [STORAGE_KEYS.ONBOARDING_DONE, "true"],
    ]);
    H.tapLight();
    setStep("mode");
  };

  // Sauvegarde le mode choisi et redirige vers l'app
  const confirmMode = async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_MODE, selectedMode);
    H.success();
    router.replace("/(tabs)");
  };

  const selectedAvatar = getAvatarById(avatarId);

  return (
    <SafeAreaView style={styles.container}>
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
          {step === "welcome" && (
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
              <Text style={styles.tagline}>
                Ton carnet d&apos;exploration des océans
              </Text>

              <View style={styles.featuresList}>
                <Feature emoji="📸" text="Identifie les espèces marines par IA" />
                <Feature emoji="📔" text="Construis ton journal de voyages" />
                <Feature emoji="🗺️" text="Cartographie tes observations" />
                <Feature emoji="🏆" text="Débloque badges et compagnons" />
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setStep("signup")}
              >
                <Text style={styles.primaryButtonText}>Créer un compte</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setStep("signin")}
              >
                <Text style={styles.secondaryButtonText}>
                  J&apos;ai déjà un compte
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={continueOffline}>
                <Text style={styles.offlineLink}>
                  Continuer sans compte (mode local)
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {step === "signup" && (
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <Text style={styles.title}>Créer ton compte</Text>
              <Text style={styles.subtitle}>
                Tes voyages seront synchronisés en sécurité.
              </Text>

              <View style={styles.previewWrap}>
                <View
                  style={[
                    styles.previewAvatar,
                    { backgroundColor: selectedAvatar.bg },
                  ]}
                >
                  <Text style={{ fontSize: 50 }}>{selectedAvatar.emoji}</Text>
                </View>
                <Text style={styles.previewLabel}>{selectedAvatar.label}</Text>
              </View>

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
                    <Text style={{ fontSize: 24 }}>{a.emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Pseudo</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: CaptainBlue"
                placeholderTextColor="#88a"
                value={username}
                onChangeText={setUsername}
                maxLength={20}
                returnKeyType="next"
              />

              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="ton.email@exemple.com"
                placeholderTextColor="#88a"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
              />

              <Text style={styles.fieldLabel}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder="8 caractères minimum"
                placeholderTextColor="#88a"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password-new"
                returnKeyType="done"
              />

              {error && <Text style={styles.error}>⚠️ {error}</Text>}
              {info && <Text style={styles.info}>ℹ️ {info}</Text>}

              <TouchableOpacity
                style={[styles.primaryButton, loading && { opacity: 0.6 }]}
                onPress={handleSignup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#01304a" />
                ) : (
                  <Text style={styles.primaryButtonText}>S&apos;inscrire 🚀</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setStep("welcome")}>
                <Text style={styles.backLink}>← Retour</Text>
              </TouchableOpacity>

              <Text style={styles.legal}>
                En t&apos;inscrivant tu acceptes nos CGU et notre politique de
                confidentialité.
              </Text>
            </Animated.View>
          )}

          {/* ── ÉTAPE MODE : choisir son rythme marin ── */}
          {step === "mode" && (
            <Animated.View
              style={[
                styles.center,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🧭</Text>
              <Text style={styles.title}>Ton rythme marin</Text>
              <Text style={styles.subtitle}>
                Adapte ta streak et tes objectifs à ta pratique
              </Text>

              <View style={{ width: "100%", marginTop: 16, gap: 12 }}>
                {MODE_CARDS.map(({ mode, emoji }) => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.modeCard,
                      selectedMode === mode && styles.modeCardSelected,
                    ]}
                    onPress={() => {
                      H.tapLight();
                      setSelectedMode(mode);
                    }}
                  >
                    <Text style={styles.modeCardEmoji}>{emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modeCardLabel}>
                        {/* Retire l'emoji du label (déjà affiché à côté) */}
                        {USER_MODE_LABELS[mode].replace(/^\S+\s/, "")}
                      </Text>
                      <Text style={styles.modeCardDesc}>
                        {USER_MODE_DESCRIPTIONS[mode]}
                      </Text>
                    </View>
                    {selectedMode === mode && (
                      <Text style={{ fontSize: 20 }}>✅</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: 24 }]}
                onPress={confirmMode}
              >
                <Text style={styles.primaryButtonText}>
                  Commencer l&apos;aventure 🌊
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {step === "signin" && (
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <Text style={styles.title}>Connexion</Text>
              <Text style={styles.subtitle}>Bon retour parmi nous 🤿</Text>

              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="ton.email@exemple.com"
                placeholderTextColor="#88a"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
              />
              <Text style={styles.fieldLabel}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#88a"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                returnKeyType="done"
              />

              {error && <Text style={styles.error}>⚠️ {error}</Text>}
              {info && <Text style={styles.info}>ℹ️ {info}</Text>}

              <TouchableOpacity
                style={[styles.primaryButton, loading && { opacity: 0.6 }]}
                onPress={handleSignin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#01304a" />
                ) : (
                  <Text style={styles.primaryButtonText}>Se connecter</Text>
                )}
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
  appName: { fontSize: 36, fontWeight: "bold", color: "white", letterSpacing: 2 },
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
  featureRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  featureEmoji: { fontSize: 22, width: 36 },
  featureText: { color: "white", fontSize: 14, flex: 1 },

  primaryButton: {
    backgroundColor: "#FFB300",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 16,
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
  secondaryButton: {
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 12,
    alignSelf: "stretch",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  secondaryButtonText: { color: "white", fontWeight: "bold", fontSize: 15 },
  offlineLink: {
    color: "rgba(255,255,255,0.5)",
    marginTop: 18,
    textDecorationLine: "underline",
    fontSize: 12,
  },
  legal: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    marginTop: 15,
    textAlign: "center",
  },

  title: { fontSize: 26, fontWeight: "bold", color: "white", textAlign: "center" },
  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginBottom: 20,
  },
  previewWrap: { alignItems: "center", marginBottom: 16 },
  previewAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.4)",
  },
  previewLabel: { color: "white", marginTop: 6, fontWeight: "bold" },

  fieldLabel: { color: "white", fontWeight: "bold", marginTop: 12, marginBottom: 6 },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    marginBottom: 6,
  },
  avatarOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  error: { color: "#FFCDD2", marginTop: 10, textAlign: "center", fontWeight: "bold" },
  info: {
    color: "#B3E5FC",
    marginTop: 10,
    textAlign: "center",
    fontWeight: "600",
    fontSize: 13,
  },
  backLink: {
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginTop: 14,
    fontSize: 14,
  },

  // ─── Sélecteur de mode ───
  modeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
    gap: 14,
  },
  modeCardSelected: {
    borderColor: "#FFB300",
    backgroundColor: "rgba(255,179,0,0.12)",
  },
  modeCardEmoji: { fontSize: 32, width: 40, textAlign: "center" },
  modeCardLabel: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  modeCardDesc: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginTop: 3,
  },
});
