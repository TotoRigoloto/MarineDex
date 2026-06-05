// Service stats / gamification.
// Calcule streak, objectifs et progression à partir des observations,
// du Pokédex local, des voyages et du mode utilisateur.
import { Animal, Observation, Trip } from "@/constants/MarineData";

// ---- Type : mode utilisateur ----

/** Rythme marin choisi par l'utilisateur à l'onboarding. */
export type UserMode = "city" | "coastal" | "regular";

export const USER_MODE_LABELS: Record<UserMode, string> = {
  city: "🏙️ Citadin voyageur",
  coastal: "🏖️ Côtier occasionnel",
  regular: "🌊 Marin régulier",
};

export const USER_MODE_DESCRIPTIONS: Record<UserMode, string> = {
  city: "Je vais à la mer quelques fois par an",
  coastal: "J'habite près de la mer, j'y vais de temps en temps",
  regular: "Je plonge ou snorkele souvent",
};

// ---- Helpers de date ----

/** Parse "DD/MM/YYYY" → Date (locale, à minuit). Retourne null si invalide. */
export function parseDmy(s: string): Date | null {
  if (!s) return null;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  if (
    d.getFullYear() !== Number(m[3]) ||
    d.getMonth() !== Number(m[2]) - 1 ||
    d.getDate() !== Number(m[1])
  )
    return null;
  return d;
}

/** Renvoie le numéro ISO de la semaine + l'année (clé unique YYYY-Www). */
export function isoWeekKey(d: Date): string {
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const week =
    1 + Math.ceil((firstThursday - target.valueOf()) / (7 * 24 * 3600 * 1000));
  return `${target.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Renvoie la clé YYYY-MM d'un mois donné. */
export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Renvoie la clé YYYY-Qn d'un trimestre donné. */
export function quarterKey(d: Date): string {
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${d.getFullYear()}-Q${q}`;
}

/** Parse "YYYY-MM-DD" → Date. Retourne null si invalide. */
export function parseIso(s: string): Date | null {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

// ---- Stats principales ----

export interface StreakInfo {
  /** Nombre d'unités consécutives (semaines, mois ou voyages selon le mode). */
  count: number;
  /** Unité pour l'affichage. */
  unit: "semaine" | "mois" | "voyage";
  /** Date de la dernière observation, format DD/MM/YYYY (ou null). */
  lastObservation: string | null;
  /** True si l'utilisateur a été actif durant la période en cours. */
  activeThisPeriod: boolean;
}

/**
 * Calcule la streak en fonction du mode utilisateur.
 *
 * - regular : semaines consécutives avec au moins une observation ou un savais-thon validé
 * - coastal  : mois consécutifs avec au moins une observation ou un savais-thon validé
 * - city     : nombre de voyages distincts avec au moins une observation
 *              (le savais-thon ne compte pas pour ce mode — seuls les voyages comptent)
 *
 * @param savaisthonDates - Dates YYYY-MM-DD où l'utilisateur a validé le savais-thon
 */
export function computeStreak(
  observations: Observation[],
  mode: UserMode = "regular",
  _trips?: Trip[],
  savaisthonDates?: string[],
): StreakInfo {
  if (observations.length === 0) {
    return {
      count: 0,
      unit: modeUnit(mode),
      lastObservation: null,
      activeThisPeriod: false,
    };
  }

  // Dernière observation (toutes unités)
  let mostRecent: Date | null = null;
  let mostRecentStr: string | null = null;
  for (const o of observations) {
    const d = parseDmy(o.date);
    if (!d) continue;
    if (!mostRecent || d > mostRecent) {
      mostRecent = d;
      mostRecentStr = o.date;
    }
  }

  if (mode === "city") {
    return computeStreakCity(observations, mostRecentStr);
  }
  if (mode === "coastal") {
    return computeStreakCoastal(observations, mostRecentStr, savaisthonDates);
  }
  return computeStreakRegular(observations, mostRecentStr, savaisthonDates);
}

/** Unité d'affichage selon le mode. */
function modeUnit(mode: UserMode): StreakInfo["unit"] {
  if (mode === "city") return "voyage";
  if (mode === "coastal") return "mois";
  return "semaine";
}

/** Mode city : compte les voyages distincts avec au moins une observation. */
function computeStreakCity(
  observations: Observation[],
  lastObs: string | null,
): StreakInfo {
  // Voyages avec au moins une obs (via tripId)
  const tripIds = new Set(
    observations.filter((o) => o.tripId).map((o) => o.tripId as string),
  );

  // Actif ce trimestre = au moins une obs dans le trimestre courant
  const thisQuarter = quarterKey(new Date());
  const activeThisPeriod = observations.some((o) => {
    const d = parseDmy(o.date);
    return d ? quarterKey(d) === thisQuarter : false;
  });

  return {
    count: tripIds.size,
    unit: "voyage",
    lastObservation: lastObs,
    activeThisPeriod,
  };
}

/** Mode coastal : mois consécutifs avec au moins une observation ou un savais-thon validé. */
function computeStreakCoastal(
  observations: Observation[],
  lastObs: string | null,
  savaisthonDates?: string[],
): StreakInfo {
  const months = new Set<string>();
  for (const o of observations) {
    const d = parseDmy(o.date);
    if (d) months.add(monthKey(d));
  }
  // Les jours de savais-thon validé comptent aussi pour le mois
  if (savaisthonDates) {
    for (const s of savaisthonDates) {
      const d = parseIso(s);
      if (d) months.add(monthKey(d));
    }
  }

  const thisMonth = monthKey(new Date());
  const activeThisPeriod = months.has(thisMonth);

  // Remonte mois par mois depuis maintenant (ou depuis le mois dernier si pas actif ce mois)
  let cursor = new Date();
  if (!activeThisPeriod) cursor.setMonth(cursor.getMonth() - 1);

  let count = 0;
  while (months.has(monthKey(cursor))) {
    count++;
    cursor.setMonth(cursor.getMonth() - 1);
  }

  return { count, unit: "mois", lastObservation: lastObs, activeThisPeriod };
}

/** Mode regular : semaines consécutives avec au moins une observation ou un savais-thon validé. */
function computeStreakRegular(
  observations: Observation[],
  lastObs: string | null,
  savaisthonDates?: string[],
): StreakInfo {
  const weeks = new Set<string>();
  for (const o of observations) {
    const d = parseDmy(o.date);
    if (d) weeks.add(isoWeekKey(d));
  }
  // Les jours de savais-thon validé comptent aussi pour la semaine
  if (savaisthonDates) {
    for (const s of savaisthonDates) {
      const d = parseIso(s);
      if (d) weeks.add(isoWeekKey(d));
    }
  }

  const thisWeek = isoWeekKey(new Date());
  const activeThisPeriod = weeks.has(thisWeek);

  // Tolère 1 semaine de gap (cf. logique originale)
  let cursor = new Date();
  if (!activeThisPeriod) cursor.setDate(cursor.getDate() - 7);

  let count = 0;
  while (weeks.has(isoWeekKey(cursor))) {
    count++;
    cursor.setDate(cursor.getDate() - 7);
  }

  return {
    count,
    unit: "semaine",
    lastObservation: lastObs,
    activeThisPeriod,
  };
}

// ---- Objectifs ----

export interface GoalProgress {
  current: number;
  target: number;
  label: string;
  icon: string;
  done: boolean;
}

export interface GoalSection {
  /** Titre de la section, ex : "🎯 Cette semaine" */
  title: string;
  goals: GoalProgress[];
}

/**
 * Calcule les sections d'objectifs adaptées au mode.
 *
 * - city     : une section trimestrielle
 * - coastal  : une section mensuelle
 * - regular  : une section hebdo + une section mensuelle
 */
export function computeGoals(
  observations: Observation[],
  animals: Animal[],
  _trips: Trip[],
  mode: UserMode = "regular",
): GoalSection[] {
  if (mode === "city") return goalsCity(observations);
  if (mode === "coastal") return goalsCoastal(observations);
  return goalsRegular(observations, animals);
}

/** Objectifs trimestriels pour le mode city. */
function goalsCity(observations: Observation[]): GoalSection[] {
  const thisQuarter = quarterKey(new Date());
  const obsQ = observations.filter((o) => {
    const d = parseDmy(o.date);
    return d ? quarterKey(d) === thisQuarter : false;
  });

  // Espèces observées pour la première fois ce trimestre
  const newSpeciesQ = new Set(
    obsQ
      .map((o) => o.speciesName)
      .filter((name) => {
        const earlier = observations.find(
          (oo) =>
            oo.speciesName === name &&
            (() => {
              const d = parseDmy(oo.date);
              return d ? quarterKey(d) !== thisQuarter : false;
            })(),
        );
        return !earlier;
      }),
  );

  return [
    {
      title: "🗓️ Ce trimestre",
      goals: [
        {
          label: "Observations ce trimestre",
          icon: "📔",
          current: obsQ.length,
          target: 5,
          done: obsQ.length >= 5,
        },
        {
          label: "Nouvelles espèces ce trimestre",
          icon: "✨",
          current: newSpeciesQ.size,
          target: 3,
          done: newSpeciesQ.size >= 3,
        },
      ],
    },
  ];
}

/** Objectifs mensuels pour le mode coastal. */
function goalsCoastal(observations: Observation[]): GoalSection[] {
  const thisMonth = monthKey(new Date());
  const obsM = observations.filter((o) => {
    const d = parseDmy(o.date);
    return d ? monthKey(d) === thisMonth : false;
  });

  const newSpeciesM = new Set(
    obsM
      .map((o) => o.speciesName)
      .filter((name) => {
        const earlier = observations.find(
          (oo) =>
            oo.speciesName === name &&
            (() => {
              const d = parseDmy(oo.date);
              return d ? monthKey(d) !== thisMonth : false;
            })(),
        );
        return !earlier;
      }),
  );

  const withPhotoM = obsM.filter((o) => !!o.userPhoto).length;

  return [
    {
      title: "📅 Ce mois-ci",
      goals: [
        {
          label: "Observations ce mois",
          icon: "📔",
          current: obsM.length,
          target: 2,
          done: obsM.length >= 2,
        },
        {
          label: "Nouvelles espèces ce mois",
          icon: "✨",
          current: newSpeciesM.size,
          target: 2,
          done: newSpeciesM.size >= 2,
        },
        {
          label: "Photos personnelles ce mois",
          icon: "📸",
          current: withPhotoM,
          target: 3,
          done: withPhotoM >= 3,
        },
      ],
    },
  ];
}

/** Objectifs hebdo + mensuels pour le mode regular (comportement original). */
function goalsRegular(
  observations: Observation[],
  animals: Animal[],
): GoalSection[] {
  const thisWeek = isoWeekKey(new Date());
  const thisMonth = monthKey(new Date());

  const obsThisWeek = observations.filter((o) => {
    const d = parseDmy(o.date);
    return d ? isoWeekKey(d) === thisWeek : false;
  });

  const newSpeciesThisWeek = new Set(
    obsThisWeek
      .map((o) => o.speciesName)
      .filter((name) => {
        const earlier = observations.find(
          (oo) =>
            oo.speciesName === name &&
            (() => {
              const d = parseDmy(oo.date);
              return d ? isoWeekKey(d) !== thisWeek : false;
            })(),
        );
        return !earlier;
      }),
  );

  const obsThisMonth = observations.filter((o) => {
    const d = parseDmy(o.date);
    return d ? monthKey(d) === thisMonth : false;
  });

  const countries = new Set(
    obsThisMonth
      .map((o) => o.location)
      .filter((l) => l && l !== "Inconnu"),
  );
  const withPhoto = obsThisMonth.filter((o) => !!o.userPhoto).length;

  // Supprime l'avertissement "animals non utilisé"
  void animals;

  return [
    {
      title: "🎯 Cette semaine",
      goals: [
        {
          label: "Observations cette semaine",
          icon: "📔",
          current: obsThisWeek.length,
          target: 3,
          done: obsThisWeek.length >= 3,
        },
        {
          label: "Nouvelles espèces cette semaine",
          icon: "✨",
          current: newSpeciesThisWeek.size,
          target: 2,
          done: newSpeciesThisWeek.size >= 2,
        },
      ],
    },
    {
      title: "📅 Ce mois-ci",
      goals: [
        {
          label: "Pays explorés ce mois",
          icon: "🌍",
          current: countries.size,
          target: 1,
          done: countries.size >= 1,
        },
        {
          label: "Photos personnelles ce mois",
          icon: "📸",
          current: withPhoto,
          target: 5,
          done: withPhoto >= 5,
        },
      ],
    },
  ];
}

// ---- Rétro-compat : anciennes fonctions (non utilisées en interne) ----
// Conservées pour éviter des erreurs de build si d'autres fichiers les importent.

/** @deprecated Utiliser computeGoals() à la place. */
export function weeklyGoals(
  observations: Observation[],
  animals: Animal[],
): GoalProgress[] {
  const sections = goalsRegular(observations, animals);
  return sections[0]?.goals ?? [];
}

/** @deprecated Utiliser computeGoals() à la place. */
export function monthlyGoals(observations: Observation[]): GoalProgress[] {
  const sections = goalsRegular(observations, []);
  return sections[1]?.goals ?? [];
}

// ---- Texte de partage ----

export function buildShareText(args: {
  username: string;
  rank: string;
  xp: number;
  observations: number;
  species: number;
  countries: number;
  trips: number;
  streakCount: number;
  streakUnit: StreakInfo["unit"];
}): string {
  const { username, rank, xp, observations, species, countries, trips, streakCount, streakUnit } =
    args;

  // Ligne de streak adaptée à l'unité
  const streakLine = (() => {
    if (streakCount <= 1) return null;
    if (streakUnit === "voyage") return `🔥 ${streakCount} voyages documentés !`;
    if (streakUnit === "mois") return `🔥 ${streakCount} mois d'affilée !`;
    return `🔥 ${streakCount} semaines consécutives !`;
  })();

  const lines = [
    `🌊 Profil MarineDex — ${username}`,
    `🎖️ ${rank} · ${xp} XP`,
    "",
    `📔 ${observations} observation${observations > 1 ? "s" : ""}`,
    `🐠 ${species} espèce${species > 1 ? "s" : ""} découverte${species > 1 ? "s" : ""}`,
    `🌍 ${countries} pays explorés`,
    `🧳 ${trips} voyage${trips > 1 ? "s" : ""}`,
  ];
  if (streakLine) lines.push(streakLine);
  lines.push("", "Rejoins-moi sur MarineDex 🤿");
  return lines.join("\n");
}
