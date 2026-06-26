// Moteur de synchronisation local ↔ Supabase.
// Stratégie simple last-write-wins basée sur updated_at.
// Photos : on upload les URIs locales (file://) vers le bucket md-photos,
// puis on remplace l'URI locale par le path Storage.
//
// Hors-ligne : on continue d'écrire en local. Le prochain call à
// syncAll() poussera les nouveautés.

import { Animal, Dive, initialAnimals, Observation, Trip } from "@/constants/MarineData";
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
  countries: string[] | null; // Multi-pays
  oceans: string[] | null; // Multi-océans
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
  dive_id: string | null;
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
    countries: t.countries?.length ? t.countries : null,
    oceans: t.oceans?.length ? t.oceans : null,
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
    countries: t.countries ?? undefined,
    oceans: t.oceans ?? undefined,
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
    dive_id: o.diveId ?? null,
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
    diveId: o.dive_id ?? undefined,
  };
}

// ============== TYPES & MAPPERS DIVES ==============
interface DbDive {
  id: string;
  user_id: string;
  trip_id: string | null;
  date: string | null;
  time_of_day: string;
  country: string | null;
  ocean: string | null;
  latitude: number | null;
  longitude: number | null;
  depth_max: number | null;
  duration_min: number | null;
  visibility_m: number | null;
  water_temp_c: number | null;
  weather: any | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function localDiveToDb(d: Dive, userId: string): Omit<DbDive, "created_at" | "updated_at"> {
  return {
    id: d.id,
    user_id: userId,
    trip_id: d.tripId ?? null,
    date: d.date || null,
    time_of_day: d.timeOfDay,
    country: d.country || null,
    ocean: d.ocean || null,
    latitude: d.latitude ?? null,
    longitude: d.longitude ?? null,
    depth_max: d.depthMax ?? null,
    duration_min: d.durationMin ?? null,
    visibility_m: d.visibilityM ?? null,
    water_temp_c: d.waterTempC ?? null,
    weather: d.weather ?? null,
    notes: d.notes || null,
  };
}

function dbDiveToLocal(d: DbDive): Dive {
  return {
    id: d.id,
    tripId: d.trip_id ?? undefined,
    date: d.date ?? "",
    timeOfDay: (d.time_of_day as Dive["timeOfDay"]) || "morning",
    country: d.country ?? "",
    ocean: d.ocean ?? "",
    latitude: d.latitude ?? undefined,
    longitude: d.longitude ?? undefined,
    depthMax: d.depth_max ?? undefined,
    durationMin: d.duration_min ?? undefined,
    visibilityM: d.visibility_m ?? undefined,
    waterTempC: d.water_temp_c ?? undefined,
    weather: d.weather ?? undefined,
    notes: d.notes ?? undefined,
    createdAt: new Date(d.created_at).getTime(),
  };
}

// ============== TYPES & MAPPERS POKÉDEX ==============
// Schéma réel : user_id (uuid), species_name (text), first_observed_at (timestamptz)
interface DbPokedexEntry {
  user_id: string;
  species_name: string;
  first_observed_at: string | null;
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
  pushedDives: number;
  pulledDives: number;
  pushedPokedex: number;
  pulledPokedex: number;
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
      pushedDives: 0,
      pulledDives: 0,
      pushedPokedex: 0,
      pulledPokedex: 0,
      error: "Pas de session — sync ignorée",
    };
  }

  let pushedTrips = 0,
    pulledTrips = 0,
    pushedObs = 0,
    pulledObs = 0,
    pushedDives = 0,
    pulledDives = 0,
    pushedPokedex = 0,
    pulledPokedex = 0;

  try {
    // ====== LECTURES LOCALES ======
    const [lt, lo, ld, lp] = await AsyncStorage.multiGet([
      STORAGE_KEYS.TRIPS,
      STORAGE_KEYS.LOGS,
      STORAGE_KEYS.DIVES,
      STORAGE_KEYS.POKEDEX,
    ]);
    const localTrips: Trip[] = lt[1] ? JSON.parse(lt[1]) : [];
    const localObs: Observation[] = lo[1] ? JSON.parse(lo[1]) : [];
    const localDives: Dive[] = ld[1] ? JSON.parse(ld[1]) : [];

    // Pokédex local : on merge avec initialAnimals pour avoir la liste complète
    let localPokedex: Animal[] = initialAnimals;
    if (lp[1]) {
      const saved: Animal[] = JSON.parse(lp[1]);
      localPokedex = initialAnimals.map((s) => {
        const found = saved.find(
          (a) => a.name.trim().toLowerCase() === s.name.trim().toLowerCase(),
        );
        return found ? { ...s, discovered: found.discovered } : s;
      });
    }

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

    // ====== PUSH DIVES ======
    for (const d of localDives) {
      const payload = localDiveToDb(d, user.id);
      const { error } = await supabase
        .from("md_dives")
        .upsert(payload, { onConflict: "id" });
      if (!error) pushedDives++;
      else console.warn("[sync] dive push error:", error.message);
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
    const { data: cloudDives } = await supabase
      .from("md_dives")
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

    const mergedDivesMap = new Map<string, Dive>();
    localDives.forEach((d) => mergedDivesMap.set(d.id, d));
    ((cloudDives as DbDive[] | null) ?? []).forEach((d) => {
      const local = mergedDivesMap.get(d.id);
      const cloud = dbDiveToLocal(d);
      if (
        !local ||
        new Date(d.updated_at).getTime() > (local.createdAt ?? 0)
      ) {
        mergedDivesMap.set(d.id, cloud);
        if (!local) pulledDives++;
      }
    });

    // ====== PUSH POKÉDEX (espèces découvertes) ======
    const discoveredLocal = localPokedex.filter((a) => a.discovered);
    for (const a of discoveredLocal) {
      const payload: DbPokedexEntry = {
        user_id: user.id,
        species_name: a.name,
        first_observed_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("md_pokedex")
        .upsert(payload, { onConflict: "user_id,species_name", ignoreDuplicates: true });
      if (!error) pushedPokedex++;
      else console.warn("[sync] pokedex push error:", error.message);
    }

    // ====== PULL POKÉDEX ======
    const { data: cloudPokedex } = await supabase
      .from("md_pokedex")
      .select("*");
    if (cloudPokedex) {
      const cloudNames = new Set(
        (cloudPokedex as DbPokedexEntry[]).map(
          (e) => e.species_name.trim().toLowerCase(),
        ),
      );
      localPokedex = localPokedex.map((a) => {
        if (!a.discovered && cloudNames.has(a.name.trim().toLowerCase())) {
          pulledPokedex++;
          return { ...a, discovered: true };
        }
        return a;
      });
    }

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
      [
        STORAGE_KEYS.DIVES,
        JSON.stringify(
          [...mergedDivesMap.values()].sort(
            (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0),
          ),
        ),
      ],
      [STORAGE_KEYS.POKEDEX, JSON.stringify(localPokedex)],
      [STORAGE_KEYS.LAST_SYNC_AT, new Date().toISOString()],
    ]);

    return {
      ok: true,
      pushedTrips, pulledTrips,
      pushedObs, pulledObs,
      pushedDives, pulledDives,
      pushedPokedex, pulledPokedex,
    };
  } catch (e: any) {
    return {
      ok: false,
      pushedTrips, pulledTrips,
      pushedObs, pulledObs,
      pushedDives, pulledDives,
      pushedPokedex, pulledPokedex,
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

/** Suppression côté cloud quand l'utilisateur supprime une plongée */
export async function deleteDiveCloud(diveId: string) {
  try {
    await supabase.from("md_dives").delete().eq("id", diveId);
  } catch (e) {
    console.warn("[sync] delete dive:", e);
  }
}
