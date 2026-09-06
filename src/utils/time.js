// Zona horaria canónica de la app (decisión cerrada por el usuario).
export const APP_TIME_ZONE = 'Europe/Madrid';

// Devuelve YYYY-MM-DD en Europe/Madrid.
export function getTodayKeyMadrid(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
  return parts; // YYYY-MM-DD
}

// Fecha larga en español para cabeceras, ej. "Viernes, 4 de septiembre".
export function formatLongDateMadrid(date = new Date()) {
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: APP_TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(date);
}

export function getGreetingMadrid(date = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat('es-ES', {
      timeZone: APP_TIME_ZONE,
      hour: 'numeric',
      hour12: false
    }).format(date)
  );
  if (hour < 12) return 'Buenos días';
  if (hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

// Número de semana ISO (misma fórmula que la cocina): sirve para que la
// repesca rote de forma determinista y muestre UNA sola recomendación
// consumida por semana.
export function getIsoWeekNumber(date = new Date()) {
  const t = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - day + 3);
  const first = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((t - first) / 86400000 - 3 + ((first.getUTCDay() + 6) % 7)) / 7);
}
