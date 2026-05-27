// Helper de capture d'image d'un View React Native + partage natif.
import * as Sharing from "expo-sharing";
import { RefObject } from "react";
import { View } from "react-native";
import { captureRef } from "react-native-view-shot";

/**
 * Capture le composant pointé par `ref` en PNG haute résolution
 * et ouvre la sheet de partage native.
 *
 * @returns le path local du PNG si succès, null si l'utilisateur annule
 *          ou si le partage n'est pas dispo (web par ex.).
 */
export async function captureAndShare(
  ref: RefObject<View | null>,
  options: { fileName?: string; dialogTitle?: string } = {},
): Promise<string | null> {
  if (!ref.current) return null;

  const uri = await captureRef(ref, {
    format: "png",
    quality: 0.95,
    result: "tmpfile",
  });

  const available = await Sharing.isAvailableAsync();
  if (!available) return uri;

  await Sharing.shareAsync(uri, {
    mimeType: "image/png",
    dialogTitle: options.dialogTitle ?? "Partager",
    UTI: "public.png",
  });

  return uri;
}
