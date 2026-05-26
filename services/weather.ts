// Service météo via Open-Meteo (API publique, gratuite, sans clé d'API).
// On récupère les conditions actuelles à un point GPS donné.
// Si on a une date passée, on tente l'API archive ; sinon current weather.

export interface WeatherSnapshot {
  airTempC?: number;
  windKmh?: number;
  waveHeightM?: number;
  weatherCode?: number;
}

// Code WMO → emoji
export function weatherEmoji(code?: number): string {
  if (code === undefined || code === null) return "❓";
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code >= 45 && code <= 48) return "🌫️";
  if (code >= 51 && code <= 67) return "🌧️";
  if (code >= 71 && code <= 77) return "❄️";
  if (code >= 80 && code <= 82) return "🌦️";
  if (code >= 95) return "⛈️";
  return "🌤️";
}

// Code WMO → libellé court FR
export function weatherLabel(code?: number): string {
  if (code === undefined || code === null) return "—";
  if (code === 0) return "Ciel clair";
  if (code <= 3) return "Partiellement nuageux";
  if (code >= 45 && code <= 48) return "Brouillard";
  if (code >= 51 && code <= 67) return "Pluie";
  if (code >= 71 && code <= 77) return "Neige";
  if (code >= 80 && code <= 82) return "Averses";
  if (code >= 95) return "Orage";
  return "Variable";
}

/**
 * Récupère la météo actuelle ou archive pour des coords données.
 * @param dateISO format YYYY-MM-DD ; si absent ou aujourd'hui → current weather
 */
export async function fetchWeather(
  latitude: number,
  longitude: number,
  dateISO?: string,
): Promise<WeatherSnapshot | null> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const isPast = dateISO && dateISO < today;

    if (isPast) {
      // Archive (jusqu'à hier)
      const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${dateISO}&end_date=${dateISO}&daily=temperature_2m_max,wind_speed_10m_max,weather_code&timezone=auto`;
      const r = await fetch(url);
      if (!r.ok) return null;
      const j = await r.json();
      const d = j?.daily;
      if (!d) return null;
      return {
        airTempC: d.temperature_2m_max?.[0],
        windKmh: d.wind_speed_10m_max?.[0],
        weatherCode: d.weather_code?.[0],
      };
    }

    // Current weather + marine (vagues) en parallèle
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,weather_code`;
    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}&current=wave_height`;

    const [w, m] = await Promise.allSettled([fetch(url), fetch(marineUrl)]);

    let snap: WeatherSnapshot = {};
    if (w.status === "fulfilled" && w.value.ok) {
      const j = await w.value.json();
      snap.airTempC = j?.current?.temperature_2m;
      snap.windKmh = j?.current?.wind_speed_10m;
      snap.weatherCode = j?.current?.weather_code;
    }
    if (m.status === "fulfilled" && m.value.ok) {
      const j = await m.value.json();
      snap.waveHeightM = j?.current?.wave_height;
    }
    return Object.keys(snap).length ? snap : null;
  } catch (e) {
    console.warn("[weather] fetch error:", e);
    return null;
  }
}

/** Convertit "DD/MM/YYYY" → "YYYY-MM-DD" (format ISO court). */
export function toIsoDate(dmy: string): string | undefined {
  if (!dmy) return undefined;
  const m = dmy.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return undefined;
  const [, d, mo, y] = m;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}
