// Categorías canónicas de Planes (decisión cerrada por el usuario).
// ~20 planes divididos en: rutas/senderismo, música, teatro/espectáculo,
// gastronomía, arte y cartelera de cine de Sevilla.

export const CATEGORY_ORDER = [
  'Rutas y naturaleza',
  'Música',
  'Teatro y espectáculos',
  'Gastronomía',
  'Arte',
  'Cine',
  'Varios'
];

const NORMALIZED = new Map();

// Rutas, senderismo y naturaleza
['ruta', 'ruta senderismo', 'senderismo', 'sendero', 'naturaleza', 'parque', 'sierra', 'excursi', 'monta', 'trekking', 'paseo verde', 'via verde', 'viaverde', 'embalse', 'marisma', 'dona', 'donana', 'camino', 'birding', 'observacion aves', 'ciclismo', 'mirador', 'jardin botanico'].forEach((k) =>
  NORMALIZED.set(k, 'Rutas y naturaleza')
);
// Música
['musica', 'música', 'concierto', 'flamenco', 'opera', 'ópera', 'jazz', 'rock', 'musical'].forEach((k) =>
  NORMALIZED.set(k, 'Música')
);
// Teatro y espectáculos
['teatro', 'danza', 'escena', 'espectaculo', 'espectáculo', 'circo', 'monologo', 'monólogo', 'comedia', 'drama'].forEach((k) =>
  NORMALIZED.set(k, 'Teatro y espectáculos')
);
// Gastronomía
['gastronom', 'gastro', 'mercado', 'restaurante', 'tapas', 'cocina', 'vino', 'cerveza', 'feria gastronomica'].forEach((k) =>
  NORMALIZED.set(k, 'Gastronomía')
);
// Arte
['arte', 'exposici', 'museo', 'pintura', 'fotografia', 'fotografía', 'escultura', 'galeria', 'galería'].forEach((k) =>
  NORMALIZED.set(k, 'Arte')
);
// Cine / cartelera
['cine', 'pelicula', 'película', 'film', 'cartelera', 'cines'].forEach((k) => NORMALIZED.set(k, 'Cine'));

function stripAccents(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizeCategory(raw) {
  if (!raw) return 'Varios';
  // Acepta string o array (contrato FeedV2 usa categories[]).
  const values = Array.isArray(raw) ? raw : [raw];
  for (const v of values) {
    if (!v) continue;
    const key = stripAccents(String(v).toLowerCase().trim());
    for (const [needle, canonical] of NORMALIZED) {
      if (key.includes(needle)) return canonical;
    }
  }
  // Si no hay coincidencia, capitaliza el primer valor tal cual.
  const first = String(values[0]).trim();
  if (!first) return 'Varios';
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export function sortCategories(cats) {
  const order = new Map(CATEGORY_ORDER.map((c, i) => [c, i]));
  return [...cats].sort((a, b) => {
    const oa = order.has(a) ? order.get(a) : 99;
    const ob = order.has(b) ? order.get(b) : 99;
    if (oa !== ob) return oa - ob;
    return a.localeCompare(b, 'es');
  });
}
