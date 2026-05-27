// Wrapper haptics propre — silencieux si la plateforme ne supporte pas
// (web, anciens devices), pas d'erreur visible côté utilisateur.
import * as Haptics from "expo-haptics";

const safeRun = (fn: () => Promise<void>) => {
  fn().catch(() => {
    /* swallow */
  });
};

/** Tap léger : sélection d'une chip, ouverture d'un modal, focus d'un input. */
export const tapLight = () =>
  safeRun(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));

/** Tap medium : confirmation d'action neutre (sauvegarder, mettre à jour). */
export const tapMedium = () =>
  safeRun(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));

/** Tap lourd : actions importantes (déblocage, partage). */
export const tapHeavy = () =>
  safeRun(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));

/** Pattern "succès" : pour identification IA, déblocage badge, voyage créé. */
export const success = () =>
  safeRun(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  );

/** Pattern "warning" : pour validation manquante. */
export const warning = () =>
  safeRun(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  );

/** Pattern "erreur" : pour échec serveur, sync KO. */
export const error = () =>
  safeRun(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  );

/** Sélection : changement de toggle, slider. */
export const selection = () =>
  safeRun(() => Haptics.selectionAsync());
