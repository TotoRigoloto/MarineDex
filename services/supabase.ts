// Client Supabase central de l'application.
// URL et clé publishable injectées depuis app.json (extra).
// Important React Native : on utilise AsyncStorage pour la session, et on désactive
// l'auto-refresh URL (pas de window.location).
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const SUPABASE_URL =
  (Constants.expoConfig?.extra?.supabaseUrl as string | undefined) ??
  "https://giibfmhllophrouifedj.supabase.co";

const SUPABASE_KEY =
  (Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined) ??
  "sb_publishable_xQUWFHHvcW-IfqXgElUV9w_eBFJYS61";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  // Garde-fou : on log mais on ne crashe pas l'app (la sync sera juste désactivée).
  console.warn(
    "[Supabase] URL ou clé manquante dans app.json → extra. La sync sera indisponible.",
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // pas de navigateur en RN
  },
});

// Helper : bucket photos
export const PHOTOS_BUCKET = "md-photos";

// Helper : construit le chemin {userId}/{tripId?}/{uuid}.jpg
export function buildPhotoPath(userId: string, fileName: string, tripId?: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return tripId ? `${userId}/${tripId}/${safeName}` : `${userId}/${safeName}`;
}

// Helper : URL publique d'une photo
export function getPhotoUrl(path?: string | null): string | null {
  if (!path) return null;
  // Si c'est déjà une URL ou un file:// local, on retourne tel quel
  if (path.startsWith("http") || path.startsWith("file:")) return path;
  const { data } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
