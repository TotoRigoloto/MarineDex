// Service stats / gamification.
// Calcule streak, objectifs hebdo/mensuels et progression à partir
// des observations et du Pokédex local.
import { Animal, Observation } from "@/constants/MarineData";

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

// ---- Stats principales ----

export interface StreakInfo {
  /** Nombre de semaines consécutives avec au moins une observation, jusqu'à cette semaine. */
  weeks: number;
  /** Date de la dernière observation, format DD/MM/YYYY (ou null). */
  lastObservation: string | null;
  /** True si l'utilisateur a observé quelque chose cette semaine. */
  activeThisWeek: boolean;
}

export function computeStreak(observations: Observation[]): StreakInfo {
  if (observations.length === 0) {
    return { weeks: 0, lastObservation: null, activeThisWeek: false };
  }

  // Set des clés de semaines où il y a eu au moins une observation
  const weeks = new Set<string>();
  let mostRecent: Date | null = null;
  let mostRecentStr: string | null = null;
  for (const o of observations) {
    const d = parseDmy(o.date);
    if (!d) continue;
    weeks.add(isoWeekKey(d));
    if (!mostRecent || d > mostRecent) {
      mostRecent = d;
      mostRecentStr = o.date;
    }
  }

  const thisWeek = isoWeekKey(new Date());
  const activeThisWeek = weeks.has(thisWeek);

  // Remonte semaine par semaine tant qu'on en trouve dans le set
  // Si pas actif cette semaine, on regarde quand même à partir de la semaine
  // précédente (sinon une streak de 5 semaines avec un trou cette semaine
  // afficherait 0, ce qui démotive ; on tolère 1 semaine de gap).
  let cursor = new Date();
  if (!activeThisWeek) cursor.setDate(cursor.getDate() - 7);

  let count = 0;
  while (weeks.has(isoWeekKey(cursor))) {
    count++;
    cursor.setDate(cursor.getDate() - 7);
  }

  return { weeks: count, lastObservation: mostRecentStr, activeThisWeek };
}

// ---- Objectifs ----

export interface GoalProgress {
  current: number;
  target: number;
  label: string;
  icon: string;
  done: boolean;
}

/** Objectifs hebdo (semaine en cours). */
export function weeklyGoals(
  observations: Observation[],
  animals: Animal[],
): GoalProgress[] {
  const thisWeek = isoWeekKey(new Date());
  const obsThisWeek = observations.filter((o) => {
    const d = parseDmy(o.date);
    return d ? isoWeekKey(d) === thisWeek : false;
  });
  const newSpeciesThisWeek = new Set(
    obsThisWeek
      .map((o) => o.speciesName)
      .filter((name) => {
        // Considérée nouvelle si jamais observée avant cette semaine
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

  return [
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
  ];
}

/** Objectifs mensuels (mois en cours). */
export function monthlyGoals(observations: Observation[]): GoalProgress[] {
  const thisMonth = monthKey(new Date());
  const obsThisMonth = observations.filter((o) => {
    const d = parseDmy(o.date);
    return d ? monthKey(d) === thisMonth : false;
  });
  const countries = new Set(
    obsThisMonth.map((o) => o.location).filter((l) => l && l !== "Inconnu"),
  );
  const withPhoto = obsThisMonth.filter((o) => !!o.userPhoto).length;

  return [
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
  ];
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
  streakWeeks: number;
}): string {
  const { username, rank, xp, observations, species, countries, trips, streakWeeks } =
    args;
  const lines = [
    `🌊 Profil MarineDex — ${username}`,
    `🎖️ ${rank} · ${xp} XP`,
    "",
    `📔 ${observations} observation${observations > 1 ? "s" : ""}`,
    `🐠 ${species} espèce${species > 1 ? "s" : ""} découverte${species > 1 ? "s" : ""}`,
    `🌍 ${countries} pays explorés`,
    `🧳 ${trips} voyage${trips > 1 ? "s" : ""}`,
  ];
  if (streakWeeks > 1) lines.push(`🔥 ${streakWeeks} semaines consécutives !`);
  lines.push("", "Rejoins-moi sur MarineDex 🤿");
  return lines.join("\n");
}
