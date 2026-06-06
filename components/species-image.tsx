// Composant image d'espèce avec résolution hybride :
// cache local > remote Supabase > fallback bundlé.
// Gère le téléchargement + cache en arrière-plan de manière transparente.

import { cacheImage, getCachedImage, getRemoteUrl, toSpeciesKey } from "@/services/image-cache";
import { Image as ExpoImage, ImageSource, ImageStyle } from "expo-image";
import React, { useEffect, useState } from "react";
import { StyleProp } from "react-native";

interface SpeciesImageProps {
  /** Nom de l'espèce (ex: "Requin Baleine") */
  name: string;
  /** Image bundlée locale (require) — fallback garanti */
  localImage: ImageSource;
  /** Style de l'image */
  style?: StyleProp<ImageStyle>;
  /** Mode de redimensionnement */
  contentFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  /** Tint pour silhouette (non-découvert) */
  tintColor?: string;
}

export default function SpeciesImage({
  name,
  localImage,
  style,
  contentFit = "contain",
  tintColor,
}: SpeciesImageProps) {
  const [source, setSource] = useState<ImageSource>(localImage);
  const speciesKey = toSpeciesKey(name);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // 1) Vérifier le cache local
        const cached = await getCachedImage(speciesKey);
        if (cached) {
          if (mounted) setSource({ uri: cached });
          return;
        }

        // 2) Utiliser l'URL remote (expo-image gère le cache HTTP)
        // + lancer le téléchargement en cache local pour l'offline
        const remoteUrl = getRemoteUrl(speciesKey);
        if (mounted) setSource({ uri: remoteUrl });

        // Cache en arrière-plan pour usage offline futur
        const cachedPath = await cacheImage(speciesKey);
        if (cachedPath && mounted) {
          setSource({ uri: cachedPath });
        }
      } catch {
        // Fallback silencieux vers l'image bundlée
        if (mounted) setSource(localImage);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [speciesKey, localImage]);

  return (
    <ExpoImage
      source={source}
      style={style}
      contentFit={contentFit}
      tintColor={tintColor}
      // Fallback vers l'image locale si le remote échoue
      onError={() => setSource(localImage)}
      transition={200}
    />
  );
}
