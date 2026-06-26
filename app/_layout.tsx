import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import ErrorBoundary from "@/components/error-boundary";
import SplashLoader from "@/components/splash-loader";
import { STORAGE_KEYS } from "@/constants/Storage";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/services/supabase";
import { syncAll } from "@/services/sync";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const unstable_settings = {
  anchor: "(tabs)",
};

// Auth guard : on attend la session Supabase ET on regarde le flag local
// (qui permet d'utiliser l'app en mode local/offline si l'utilisateur le choisit).
function useAuthRedirect() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const localFlag = await AsyncStorage.getItem(STORAGE_KEYS.HAS_ACCOUNT);
        if (!mounted) return;
        setAuthed(!!data.session || localFlag === "true");
      } catch {
        if (!mounted) return;
        setAuthed(false);
      } finally {
        // petit délai pour laisser le splash respirer
        setTimeout(() => mounted && setReady(true), 600);
      }
    };

    checkSession();

    // Réagit aux changements d'auth (logout depuis Réglages, etc.)
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!mounted) return;
      if (session) setAuthed(true);
      // ne pas mettre setAuthed(false) ici : on garde l'utilisateur en mode local
      // s'il n'a pas vraiment cliqué sur "Déconnexion".
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const inAuth = segments[0] === "login";
    if (!authed && !inAuth) router.replace("/login");
    else if (authed && inAuth) router.replace("/(tabs)");
  }, [ready, authed, segments, router]);

  return ready;
}

// Sync automatique : au login et au retour dans l'app (AppState → active)
function useAutoSync() {
  const hasSyncedOnMount = useRef(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Sync initiale au montage (= après login)
    if (!hasSyncedOnMount.current) {
      hasSyncedOnMount.current = true;
      syncAll().then((r) => {
        if (!r.ok) console.warn("[auto-sync] init:", r.error);
      });
    }

    // Sync au retour dans l'app (background → active)
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === "active") {
        syncAll().then((r) => {
          if (!r.ok) console.warn("[auto-sync] resume:", r.error);
        });
      }
      appState.current = next;
    });

    return () => sub.remove();
  }, []);
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const ready = useAuthRedirect();
  useAutoSync();

  if (!ready) {
    return <SplashLoader subtitle="Préparation de l'océan…" />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
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
            name="settings"
            options={{ headerShown: false, presentation: "card" }}
          />
          <Stack.Screen
            name="legal/privacy"
            options={{ headerShown: false, presentation: "card" }}
          />
          <Stack.Screen
            name="legal/terms"
            options={{ headerShown: false, presentation: "card" }}
          />
          <Stack.Screen
            name="legal/about"
            options={{ headerShown: false, presentation: "card" }}
          />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
          </Stack>
          <StatusBar style="light" />
        </ThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
