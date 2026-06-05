// Centralise toutes les clés AsyncStorage de l'app
// Permet d'éviter les fautes de frappe et de retrouver
// facilement qui lit/écrit quoi.

export const STORAGE_KEYS = {
  // Données métier
  POKEDEX: "pokedex_save",
  LOGS: "user_logs",
  TRIPS: "user_trips",
  DIVES: "user_dives",

  // Profil
  BUDDY: "user_buddy",
  AVATAR_COLOR: "user_avatar_color",
  AVATAR_ID: "user_avatar_id", // NOUVEAU : ID de l'avatar choisi
  USERNAME: "user_name",
  USER_EMAIL: "user_email",
  USER_CREATED_AT: "user_created_at",

  // Gamification
  USER_MODE: "user_mode", // 'city' | 'coastal' | 'regular'
  SAVAISTHON_DATES: "savaisthon_dates", // string[] de dates YYYY-MM-DD validées

  // Flags
  ONBOARDING_DONE: "onboarding_done",
  HAS_ACCOUNT: "has_account",

  // Préférences / état session
  LAST_SYNC_AT: "last_sync_at",
  NOTIFICATIONS_ENABLED: "notifications_enabled",
} as const;

// --- AVATARS PRÉDÉFINIS ---
// Combine un emoji "personnage" et une couleur de fond.
// Plus visuel que la seule couleur de combinaison.
export interface AvatarPreset {
  id: string;
  emoji: string;
  bg: string;
  label: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: "diver_blue", emoji: "🤿", bg: "#006994", label: "Plongeur Bleu" },
  { id: "diver_red", emoji: "🤿", bg: "#E53935", label: "Plongeur Rouge" },
  { id: "diver_green", emoji: "🤿", bg: "#43A047", label: "Plongeur Algue" },
  { id: "diver_orange", emoji: "🤿", bg: "#FB8C00", label: "Plongeur Corail" },
  { id: "mermaid", emoji: "🧜‍♀️", bg: "#00ACC1", label: "Sirène" },
  { id: "merman", emoji: "🧜‍♂️", bg: "#5E35B1", label: "Triton" },
  { id: "captain", emoji: "🧑‍✈️", bg: "#0277BD", label: "Capitaine" },
  { id: "scientist", emoji: "🧑‍🔬", bg: "#26A69A", label: "Biologiste" },
  { id: "sailor_f", emoji: "👩‍🦱", bg: "#039BE5", label: "Marin" },
  { id: "sailor_m", emoji: "👨‍🦰", bg: "#01579B", label: "Navigateur" },
  { id: "shark_fan", emoji: "🦈", bg: "#37474F", label: "Fan Requin" },
  { id: "turtle_fan", emoji: "🐢", bg: "#558B2F", label: "Fan Tortue" },
];

export const getAvatarById = (id?: string | null): AvatarPreset => {
  if (!id) return AVATAR_PRESETS[0];
  return AVATAR_PRESETS.find((a) => a.id === id) ?? AVATAR_PRESETS[0];
};
