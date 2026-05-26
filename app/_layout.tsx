import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";

import SplashLoader from "@/components/splash-loader";
import { STORAGE_KEYS } from "@/constants/Storage";
import { useColorScheme } from "@/hooks/use-color-scheme";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const unstable_settings = {
  anchor: "(tabs)",
};

// Petit hook : vérifie si l'utilisateur a déjà créé son profil local
function useAuthRedirect() {
  const [ready, setReady] = useState(false);
  const [hasAccount, setHasAccount] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const check = async () => {
      try {
        const v = await AsyncStorage.getItem(STORAGE_KEYS.HAS_ACCOUNT);
        setHasAccount(v === "true");
      } catch {
        setHasAccount(false);
      } finally {
        // Petit délai pour laisser la splash respirer (UX, pas trop court)
        setTimeout(() => setReady(true), 700);
      }
    };
    check();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const inAuthGroup = segments[0] === "login";

    if (!hasAccount && !inAuthGroup) {
      router.replace("/login");
    } else if (hasAccount && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [ready, hasAccount, segments, router]);

  return ready;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const ready = useAuthRedirect();

  if (!ready) {
    return <SplashLoader subtitle="Préparation de l'océan…" />;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="login"
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen
          name="trip/[id]"
          options={{ headerShown: false, presentation: "card" }}
        />
        <Stack.Screen
          name="revosea"
          options={{ headerShown: false, presentation: "card" }}
        />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
