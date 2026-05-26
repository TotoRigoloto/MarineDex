// Service d'authentification Supabase + helpers locaux.
// Stratégie : compte Supabase obligatoire pour profiter du cloud,
// mais l'app reste utilisable hors-ligne (les écritures sont mises en cache
// localement et synchronisées dès qu'on a Auth + réseau).

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { STORAGE_KEYS } from "../constants/Storage";
import { supabase } from "./supabase";

// ============== HELPERS ==============

export async function signUp(
  email: string,
  password: string,
  meta: { username: string; avatar_id: string },
) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { data: meta },
  });
  if (error) throw error;

  // Si signup mais email confirmation activée, on a pas encore de session.
  // L'utilisateur devra valider son email puis se connecter.
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
  // On NE supprime PAS les données locales (l'utilisateur peut continuer
  // en local et se reconnecter plus tard). Seul "supprimer mon compte" purge.
}

export async function deleteAccount() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error("Pas connecté");

  // Supprime les données dans Supabase (les RLS + ON DELETE CASCADE font le reste).
  // Note : delete user via API auth requiert le service role.
  // Pour un MVP, on supprime les data métier et on déconnecte.
  await supabase.from("md_profiles").delete().eq("id", userData.user.id);
  await supabase.auth.signOut();

  // Purge locale
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
  ]);
}

// ============== HOOK ==============

export interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setState({
        session: data.session,
        user: data.session?.user ?? null,
        loading: false,
      });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!mounted) return;
      setState({
        session,
        user: session?.user ?? null,
        loading: false,
      });
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
