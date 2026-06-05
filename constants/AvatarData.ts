// Données du système d'avatars composables.
// Chaque couche est indépendante et peut être modifiée séparément.
// Les éléments "verrouillés" nécessitent un badge, un grade XP ou un nb de voyages.

// ---- Types ----

/** Configuration complète d'un avatar. Stockée en JSON dans AsyncStorage. */
export interface AvatarConfig {
  skin: string;        // ex : "tone3"
  hairStyle: string;   // ex : "short"
  hairColor: string;   // ex : "brown"
  face: string;        // ex : "happy"
  outfitStyle: string; // ex : "wetsuit"
  outfitColor: string; // ex : "blue"
  accessory: string | null; // ex : "mask" ou null
}

/** Condition de déblocage d'un item. */
export interface LockCondition {
  type: "xp" | "trips" | "badge";
  /** Valeur numérique (XP ou nb de voyages) ou id de badge. */
  value: number | string;
  /** Texte affiché dans l'UI pour expliquer comment débloquer. */
  label: string;
}

/** Option générique pour un calque d'avatar. */
export interface AvatarOption {
  id: string;
  label: string;
  lockedBy?: LockCondition;
}

/** Option de couleur (skin, cheveux, tenue). */
export interface ColorOption extends AvatarOption {
  color: string;
}

// ---- Configuration par défaut ----

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  skin: "tone2",
  hairStyle: "short",
  hairColor: "brown",
  face: "happy",
  outfitStyle: "rashguard",
  outfitColor: "blue",
  accessory: null,
};

// ---- Couleurs de peau ----

export const SKIN_OPTIONS: ColorOption[] = [
  { id: "tone1", label: "Très clair", color: "#FDDBB5" },
  { id: "tone2", label: "Clair", color: "#EFC090" },
  { id: "tone3", label: "Médium", color: "#D4945A" },
  { id: "tone4", label: "Hâlé", color: "#B87040" },
  { id: "tone5", label: "Foncé", color: "#7D4325" },
  { id: "tone6", label: "Très foncé", color: "#3E1C0A" },
];

// ---- Styles de cheveux ----

export const HAIR_STYLE_OPTIONS: AvatarOption[] = [
  { id: "bald", label: "Rasé" },
  { id: "short", label: "Courte" },
  { id: "medium", label: "Mi-longue" },
  { id: "long", label: "Longue" },
  { id: "curly", label: "Bouclée" },
  { id: "bun", label: "Chignon" },
];

// ---- Couleurs de cheveux ----

export const HAIR_COLOR_OPTIONS: ColorOption[] = [
  { id: "black", label: "Noir", color: "#1A1A1A" },
  { id: "brown", label: "Brun", color: "#6B3A2A" },
  { id: "auburn", label: "Auburn", color: "#922B21" },
  { id: "blonde", label: "Blond", color: "#D4AC0D" },
  { id: "gray", label: "Gris", color: "#85929E" },
  { id: "blue", label: "Bleu ✨", color: "#1A6BA0" },
];

// ---- Expressions de visage ----

export const FACE_OPTIONS: AvatarOption[] = [
  { id: "happy", label: "Joyeux 😊" },
  { id: "cool", label: "Cool 😎" },
  { id: "surprised", label: "Surpris 😮" },
  { id: "determined", label: "Déterminé 😤" },
  { id: "chill", label: "Relax 😌" },
];

// ---- Styles de tenue ----

export const OUTFIT_STYLE_OPTIONS: AvatarOption[] = [
  { id: "rashguard", label: "Rashguard" },
  { id: "shorty", label: "Shorty" },
  { id: "wetsuit", label: "Combi shorty" },
  {
    id: "fullsuit",
    label: "Combi intégrale",
    lockedBy: {
      type: "xp",
      value: 3000,
      label: "Débloqué au grade Dive Master (3 000 XP)",
    },
  },
  { id: "swimsuit", label: "Maillot" },
];

// ---- Couleurs de tenue ----

export const OUTFIT_COLOR_OPTIONS: ColorOption[] = [
  { id: "blue", label: "Bleu marine", color: "#006994" },
  { id: "black", label: "Noir", color: "#1C2833" },
  { id: "teal", label: "Lagon", color: "#0097A7" },
  { id: "orange", label: "Corail", color: "#E55B1D" },
  { id: "red", label: "Rouge", color: "#C0392B" },
  { id: "green", label: "Algue", color: "#1E8449" },
  { id: "purple", label: "Mauve", color: "#6C3483" },
  { id: "white", label: "Blanc", color: "#ECF0F1" },
];

// ---- Accessoires ----

export const ACCESSORY_OPTIONS: AvatarOption[] = [
  { id: "none", label: "Aucun" },
  {
    id: "mask",
    label: "Masque de plongée",
    lockedBy: {
      type: "badge",
      value: "first_dive",
      label: "Débloqué avec le badge « Première Bulle »",
    },
  },
  { id: "goggles", label: "Lunettes de nage" },
  { id: "snorkel", label: "Tuba" },
  {
    id: "cap_revosea",
    label: "Casquette Revosea 🤿",
    lockedBy: {
      type: "trips",
      value: 5,
      label: "Débloqué après 5 voyages",
    },
  },
];

// ---- Helpers ----

export function getSkinColor(id: string): string {
  return SKIN_OPTIONS.find((o) => o.id === id)?.color ?? SKIN_OPTIONS[1].color;
}

export function getHairColor(id: string): string {
  return (
    HAIR_COLOR_OPTIONS.find((o) => o.id === id)?.color ??
    HAIR_COLOR_OPTIONS[1].color
  );
}

export function getOutfitColor(id: string): string {
  return (
    OUTFIT_COLOR_OPTIONS.find((o) => o.id === id)?.color ??
    OUTFIT_COLOR_OPTIONS[0].color
  );
}

/**
 * Vérifie si un item est débloqué par l'utilisateur.
 * @param lock   - condition de déblocage (null si pas de lock)
 * @param userXp - XP total de l'utilisateur
 * @param userTrips - nombre de voyages de l'utilisateur
 * @param unlockedBadgeIds - liste des IDs de badges débloqués
 */
export function isUnlocked(
  lock: LockCondition | undefined,
  userXp: number,
  userTrips: number,
  unlockedBadgeIds: string[],
): boolean {
  if (!lock) return true;
  if (lock.type === "xp") return userXp >= (lock.value as number);
  if (lock.type === "trips") return userTrips >= (lock.value as number);
  if (lock.type === "badge") return unlockedBadgeIds.includes(lock.value as string);
  return false;
}
