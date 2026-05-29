// Service CRUD local pour les plongées (Dives).
// Toutes les opérations passent par AsyncStorage.
// La sync cloud est gérée par services/sync.ts.

import { Dive } from "@/constants/MarineData";
import { STORAGE_KEYS } from "@/constants/Storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** Charge toutes les plongées depuis AsyncStorage */
export async function loadDives(): Promise<Dive[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.DIVES);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("[dives] load error:", e);
    return [];
  }
}

/** Persiste la liste complète des plongées */
async function persistDives(dives: Dive[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.DIVES, JSON.stringify(dives));
}

/** Sauvegarde (création ou mise à jour) d'une plongée */
export async function saveDive(dive: Dive): Promise<Dive[]> {
  const all = await loadDives();
  const idx = all.findIndex((d) => d.id === dive.id);
  if (idx >= 0) {
    all[idx] = dive;
  } else {
    all.unshift(dive); // Nouvelles plongées en tête
  }
  await persistDives(all);
  return all;
}

/** Supprime une plongée par id (ne touche pas aux observations rattachées) */
export async function deleteDive(diveId: string): Promise<Dive[]> {
  const all = await loadDives();
  const filtered = all.filter((d) => d.id !== diveId);
  await persistDives(filtered);
  return filtered;
}

/** Plongées d'un voyage donné */
export function getDivesForTrip(dives: Dive[], tripId: string): Dive[] {
  return dives.filter((d) => d.tripId === tripId);
}

/** Plongées récentes (dernières 48h) — pour les suggestions rapides */
export function getRecentDives(dives: Dive[]): Dive[] {
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  return dives.filter((d) => d.createdAt >= cutoff);
}
