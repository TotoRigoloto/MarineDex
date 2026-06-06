// Cache d'images espèces — stratégie hybride online/offline.
// Priorité : cache local (FileSystem) > remote (Supabase) > fallback bundlé.
// En plongée (pas de réseau), les images bundlées s'affichent sans latence.
// Sur la plage (4G), les images Supabase se téléchargent et se cachent
// pour les prochaines sessions offline.

import * as FileSystem from "expo-file-system/legacy";
import { ImageSource } from "expo-image";

const SUPABASE_BUCKET_URL =
  "https://giibfmhllophrouifedj.supabase.co/storage/v1/object/public/species-assets";

// Dossier de cache sur le device
const CACHE_DIR = `${FileSystem.cacheDirectory}species-cache/`;

// Garantir que le dossier de cache existe
let dirReady = false;
async function ensureCacheDir(): Promise<void> {
  if (dirReady) return;
  const info = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
  dirReady = true;
}

// Convertit un nom d'espèce en clé snake_case pour le bucket
// Ex: "Requin Baleine" → "requin_baleine"
export function toSpeciesKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // retire les accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

// URL publique Supabase pour une espèce
export function getRemoteUrl(speciesKey: string): string {
  return `${SUPABASE_BUCKET_URL}/${speciesKey}.png`;
}

// Chemin local du fichier caché
function getCachePath(speciesKey: string): string {
  return `${CACHE_DIR}${speciesKey}.png`;
}

// Vérifie si l'image est déjà en cache local
export async function getCachedImage(
  speciesKey: string,
): Promise<string | null> {
  try {
    await ensureCacheDir();
    const path = getCachePath(speciesKey);
    const info = await FileSystem.getInfoAsync(path);
    return info.exists ? path : null;
  } catch {
    return null;
  }
}

// Télécharge l'image remote et la stocke en cache
export async function cacheImage(
  speciesKey: string,
): Promise<string | null> {
  try {
    await ensureCacheDir();
    const url = getRemoteUrl(speciesKey);
    const path = getCachePath(speciesKey);
    const result = await FileSystem.downloadAsync(url, path);
    // Vérifie que le téléchargement a bien renvoyé une image
    if (result.status === 200) return path;
    // Supprime le fichier corrompu/vide
    await FileSystem.deleteAsync(path, { idempotent: true });
    return null;
  } catch {
    return null;
  }
}

// Résout la meilleure source d'image disponible pour une espèce.
// Retourne une ImageSource compatible avec expo-image.
// 1) Cache local (instantané, offline)
// 2) URL remote Supabase (online, sera cachée en background)
// 3) Fallback bundlé (toujours disponible)
export async function resolveImageSource(
  speciesKey: string,
  localFallback: ImageSource,
): Promise<{ source: ImageSource; shouldCache: boolean }> {
  try {
    // 1) Cache local
    const cached = await getCachedImage(speciesKey);
    if (cached) return { source: { uri: cached }, shouldCache: false };

    // 2) Remote disponible → on retourne l'URL, le composant cachera après
    return {
      source: { uri: getRemoteUrl(speciesKey) },
      shouldCache: true,
    };
  } catch {
    // 3) Fallback bundlé
    return { source: localFallback, shouldCache: false };
  }
}

// Pré-cache une liste d'espèces en arrière-plan (batch, non bloquant)
export async function prefetchSpeciesImages(
  speciesKeys: string[],
): Promise<void> {
  await ensureCacheDir();
  // On traite par lots de 5 pour ne pas saturer le réseau
  const BATCH = 5;
  for (let i = 0; i < speciesKeys.length; i += BATCH) {
    const batch = speciesKeys.slice(i, i + BATCH);
    await Promise.allSettled(
      batch.map(async (key) => {
        const cached = await getCachedImage(key);
        if (!cached) await cacheImage(key);
      }),
    );
  }
}
