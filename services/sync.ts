// Moteur de synchronisation local ↔ Supabase.
// Stratégie simple last-write-wins basée sur updated_at.
// Photos : on upload les URIs locales (file://) vers le bucket md-photos,
// puis on remplace l'URI locale par le path Storage.
//
// Hors-ligne : on continue d'écrire en local. Le prochain call à
// syncAll() poussera les nouveautés.

import { Observation, Trip } from "@/constants/MarineData";
import { STORAGE_KEYS } from "@/constants/Storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { buildPhotoPath, PHOTOS_BUCKET, supabase } from "./supabase";

// ============== TYPES BDD (snake_case) ==============
interface DbTrip {
  id: string;
  user_id: string;
  name: string;
  country: string | null;
  start_date: string | null;
  end_date: string | null;
  cover_photo_path: string | null;
  color: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface DbObservation {
  id: string;
  user_id: string;
  trip_id: string | null;
  species_name: string;
  date: string | null;
  location: string | null;
  ocean: string | null;
  latitude: number | null;
  longitude: number | null;
  photo_path: string | null;
  notes: string | null;
  depth_m: number | null;
  duration_min: number | null;
  visibility_m: number | null;
  water_temp_c: number | null;
  created_at: string;
  updated_at: string;
}

// ============== MAPPERS ==============
function localTripToDb(t: Trip, userId: string): Omit<DbTrip, "created_at" | "updated_at"> {
  return {
    id: t.id,
    user_id: userId,
    name: t.name,
    country: t.country || null,
    start_date: t.startDate || null,
    end_date: t.endDate || null,
    cover_photo_path: t.coverPhoto || null,
    color: t.color,
    notes: t.notes || null,
  };
}

function dbTripToLocal(t: DbTrip): Trip {
  return {
    id: t.id,
    name: t.name,
    country: t.country ?? "",
    startDate: t.start_date ?? "",
    endDate: t.end_date ?? "",
    coverPhoto: t.cover_photo_path ?? undefined,
    color: t.color,
    notes: t.notes ?? undefined,
    createdAt: new Date(t.created_at).getTime(),
  };
}

function localObsToDb(o: Observation, userId: string): Omit<DbObservation, "created_at" | "updated_at"> {
  return {
    id: o.id,
    user_id: userId,
    trip_id: o.tripId ?? null,
    species_name: o.speciesName,
    date: o.date,
    location: o.location || null,
    ocean: o.ocean || null,
    latitude: o.latitude ?? null,
    longitude: o.longitude ?? null,
    photo_path: o.userPhoto ?? null,
    notes: o.notes ?? null,
    // dive details — extension future, on les laisse à null si absents
    depth_m: null,
    duration_min: null,
    visibility_m: null,
    water_temp_c: null,
  };
}

function dbObsToLocal(o: DbObservation): Observation {
  return {
    id: o.id,
    speciesName: o.species_name,
    date: o.date ?? "",
    location: o.location ?? "Inconnu",
    ocean: o.ocean ?? "Non précisé",
    userPhoto: o.photo_path ?? undefined,
    notes: o.notes ?? undefined,
    latitude: o.latitude ?? undefined,
    longitude: o.longitude ?? undefined,
    tripId: o.trip_id ?? undefined,
  };
}

// ============== PHOTO UPLOAD ==============
// Upload une URI locale (file://...) vers Supabase Storage.
// Retourne le path stocké en base, ou l'URI originale si l'upload échoue.
async function uploadPhotoIfLocal(
  uri: string | undefined,
  userId: string,
  tripId?: string,
): Promise<string | undefined> {
  if (!uri) return undefined;
  // Déjà uploadé (path Storage) ou déjà une URL → on ne refait rien
  if (!uri.startsWith("file:")) return uri;

  try {
    const fileName = `${Date.now()}_${uri.split("/").pop() ?? "photo.jpg"}`;
    const path = buildPhotoPath(userId, fileName, tripId);

    // Lit le fichier en base64 puis convertit en ArrayBuffer pour upload
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const bytes = base64ToUint8Array(base64);

    const { error } = await supabase.storage
      .from(PHOTOS_BUCKET)
      .upload(path, bytes, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (error) {
      console.warn("[sync] upload photo failed:", error.message);
      return uri; // fallback
    }
    return path;
  } catch (e) {
    console.warn("[sync] upload exception:", e);
    return uri;
  }
}

function base64ToUint8Array(b64: string): Uint8Array {
  // RN n'a pas de Buffer, on décode manuellement
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;
  let bufferLength = b64.length * 0.75;
  if (b64.endsWith("=")) bufferLength--;
  if (b64.endsWith("==")) bufferLength--;
  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < b64.length; i += 4) {
    const e1 = lookup[b64.charCodeAt(i)];
    const e2 = lookup[b64.charCodeAt(i + 1)];
    const e3 = lookup[b64.charCodeAt(i + 2)];
    const e4 = lookup[b64.charCodeAt(i + 3)];
    bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (e3 !== 64) bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    if (e4 !== 64) bytes[p++] = ((e3 & 3) << 6) | e4;
  }
  return bytes;
}

// ============== SYNC ==============
export interface SyncResult {
  ok: boolean;
  pushedTrips: number;
  pulledTrips: number;
  pushedObs: number;
  pulledObs: number;
  error?: string;
}

/**
 * Pousse les données locales vers Supabase + récupère ce qui manque.
 * Idempotent : peut être appelé à n'importe quel moment.
 * À appeler : au login, après chaque écriture importante, au focus de l'app.
 */
export async function syncAll(): Promise<SyncResult> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    return {
      ok: false,
      pushedTrips: 0,
      pulledTrips: 0,
      pushedObs: 0,
      pulledObs: 0,
      error: "Pas de session — sync ignorée",
    };
  }

  let pushedTrips = 0,
    pulledTrips = 0,
    pushedObs = 0,
    pulledObs = 0;

  try {
    // ====== LECTURES LOCALES ======
    const [lt, lo] = await AsyncStorage.multiGet([
      STORAGE_KEYS.TRIPS,
      STORAGE_KEYS.LOGS,
    ]);
    const localTrips: Trip[] = lt[1] ? JSON.parse(lt[1]) : [];
    const localObs: Observation[] = lo[1] ? JSON.parse(lo[1]) : [];

    // ====== PUSH TRIPS ======
    for (const t of localTrips) {
      // Upload cover si nécessaire
      const newCover = await uploadPhotoIfLocal(t.coverPhoto, user.id, t.id);
      if (newCover && newCover !== t.coverPhoto) t.coverPhoto = newCover;

      const payload = localTripToDb(t, user.id);
      const { error } = await supabase
        .from("md_trips")
        .upsert(payload, { onConflict: "id" });
      if (!error) pushedTrips++;
      else console.warn("[sync] trip push error:", error.message);
    }

    // ====== PUSH OBSERVATIONS ======
    for (const o of localObs) {
      const newPhoto = await uploadPhotoIfLocal(
        o.userPhoto,
        user.id,
        o.tripId ?? undefined,
      );
      if (newPhoto && newPhoto !== o.userPhoto) o.userPhoto = newPhoto;

      const payload = localObsToDb(o, user.id);
      const { error } = await supabase
        .from("md_observations")
        .upsert(payload, { onConflict: "id" });
      if (!error) pushedObs++;
      else console.warn("[sync] obs push error:", error.message);
    }

    // ====== PULL : récupère tout depuis le cloud ======
    const { data: cloudTrips } = await supabase
      .from("md_trips")
      .select("*")
      .order("created_at", { ascending: false });
    const { data: cloudObs } = await supabase
      .from("md_observations")
      .select("*")
      .order("created_at", { ascending: false });

    const mergedTripsMap = new Map<string, Trip>();
    localTrips.forEach((t) => mergedTripsMap.set(t.id, t));
    (cloudTrips ?? []).forEach((t) => {
      const local = mergedTripsMap.get(t.id);
      const cloud = dbTripToLocal(t);
      // Last-write-wins (par défaut, le cloud gagne si plus récent)
      if (
        !local ||
        new Date(t.updated_at).getTime() > (local.createdAt ?? 0)
      ) {
        mergedTripsMap.set(t.id, cloud);
        if (!local) pulledTrips++;
      }
    });

    const mergedObsMap = new Map<string, Observation>();
    localObs.forEach((o) => mergedObsMap.set(o.id, o));
    (cloudObs ?? []).forEach((o) => {
      const local = mergedObsMap.get(o.id);
      const cloud = dbObsToLocal(o);
      if (!local) {
        mergedObsMap.set(o.id, cloud);
        pulledObs++;
      }
    });

    // Persiste le merge
    await AsyncStorage.multiSet([
      [
        STORAGE_KEYS.TRIPS,
        JSON.stringify(
          [...mergedTripsMap.values()].sort(
            (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0),
          ),
        ),
      ],
      [STORAGE_KEYS.LOGS, JSON.stringify([...mergedObsMap.values()])],
    ]);

    return { ok: true, pushedTrips, pulledTrips, pushedObs, pulledObs };
  } catch (e: any) {
    return {
      ok: false,
      pushedTrips,
      pulledTrips,
      pushedObs,
      pulledObs,
      error: e?.message ?? "erreur inconnue",
    };
  }
}

/** Suppression côté cloud quand l'utilisateur supprime un trip localement */
export async function deleteTripCloud(tripId: string) {
  try {
    await supabase.from("md_trips").delete().eq("id", tripId);
  } catch (e) {
    console.warn("[sync] delete trip:", e);
  }
}

/** Suppression côté cloud quand l'utilisateur supprime une obs */
export async function deleteObsCloud(obsId: string) {
  try {
    await supabase.from("md_observations").delete().eq("id", obsId);
  } catch (e) {
    console.warn("[sync] delete obs:", e);
  }
}
