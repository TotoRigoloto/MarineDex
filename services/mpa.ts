// Service Aires Marines Protégées.
// Lit bdd_zones_protegees côté Supabase et cache localement.
// On charge par "bounding box" de la carte pour éviter de charger les 3545
// points d'un coup sur l'appareil.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

export interface ProtectedZone {
  id: string;
  label: string | null;
  nom: string | null;
  pays: string | null;
  continent: string | null;
  certification_level: string | null;
  site_du_centre: string | null;
  latitude: number;
  longitude: number;
}

const CACHE_KEY = "mpa_cache_v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

/**
 * Récupère les MPA visibles dans la zone donnée.
 * Si offline, retourne le cache complet précédemment téléchargé.
 */
export async function fetchProtectedZones(bbox?: {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}): Promise<ProtectedZone[]> {
  // Tente le cache d'abord
  const cached = await loadCache();

  try {
    let q = supabase
      .from("bdd_zones_protegees")
      .select(
        "id, label, nom, pays, continent, certification_level, site_du_centre, latitude, longitude",
      )
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (bbox) {
      q = q
        .gte("latitude", bbox.minLat)
        .lte("latitude", bbox.maxLat)
        .gte("longitude", bbox.minLng)
        .lte("longitude", bbox.maxLng);
    }

    // Plafond raisonnable pour ne pas saturer l'app
    q = q.limit(500);

    const { data, error } = await q;
    if (error) {
      console.warn("[mpa] fetch error:", error.message);
      return cached?.zones ?? [];
    }

    const zones: ProtectedZone[] = (data ?? []).map((z) => ({
      id: z.id,
      label: z.label,
      nom: z.nom,
      pays: z.pays,
      continent: z.continent,
      certification_level: z.certification_level,
      site_du_centre: z.site_du_centre,
      latitude: Number(z.latitude),
      longitude: Number(z.longitude),
    }));

    // Mise en cache (seulement si pas de bbox = chargement global)
    if (!bbox) {
      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ at: Date.now(), zones }),
      );
    }
    return zones;
  } catch (e) {
    console.warn("[mpa] exception:", e);
    return cached?.zones ?? [];
  }
}

async function loadCache(): Promise<{ at: number; zones: ProtectedZone[] } | null> {
  try {
    const s = await AsyncStorage.getItem(CACHE_KEY);
    if (!s) return null;
    const parsed = JSON.parse(s);
    if (Date.now() - parsed.at > CACHE_TTL_MS) return null; // expiré
    return parsed;
  } catch {
    return null;
  }
}

// Couleur du marker selon le label de certification
export function getZoneColor(label?: string | null): string {
  if (!label) return "#26A69A";
  const l = label.toLowerCase();
  if (l.includes("blue flag")) return "#0288D1"; // bleu drapeau bleu
  if (l.includes("ramsar")) return "#43A047"; // vert pour zone humide
  if (l.includes("unesco")) return "#FFB300"; // doré
  if (l.includes("marine") || l.includes("park")) return "#00838F";
  return "#26A69A";
}
