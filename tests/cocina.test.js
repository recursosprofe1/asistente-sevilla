import { describe, it, expect } from 'vitest';
import { normCat, zoneOf, toIsoMadrid, coerceTravel, normTitle, isExcluded, recentFeedTitles, backfillFromArchive, NO_REPEAT_DAYS } from '../scripts/build-feed.mjs';

describe('toIsoMadrid', () => {
  it('verano: offset +02:00 real', () => {
    const iso = toIsoMadrid(new Date('2026-07-15T12:00:00Z'));
    expect(iso).toBe('2026-07-15T14:00:00+02:00');
  });
  it('invierno: offset +01:00', () => {
    const iso = toIsoMadrid(new Date('2026-01-15T12:00:00Z'));
    expect(iso).toBe('2026-01-15T13:00:00+01:00');
  });
  it('medianoche: hora 00, nunca 24', () => {
    const iso = toIsoMadrid(new Date('2026-01-15T23:00:00Z'));
    expect(iso).toMatch(/T00:00:00\+01:00$/);
  });
});

describe('normCat', () => {
  it('nunca devuelve Varios: todo cae en una pastilla real', () => {
    expect(normCat('Varios', 'cata inventada')).toBe('Arte');
    expect(normCat('', '')).toBe('Arte');
  });
  it('artesanía/alfarería/cerámica → Arte (regla del prompt)', () => {
    expect(normCat('Varios', 'Taller de alfarería')).toBe('Arte');
    expect(normCat('Varios', 'Oficio de la cerámica trianera')).toBe('Arte');
  });
  it('casa el hint antes que el fallback', () => {
    expect(normCat('Otra cosa', 'concierto de jazz')).toBe('Música');
  });
});

describe('zoneOf', () => {
  it('municipios reales de cada provincia', () => {
    expect(zoneOf('La Rinconada')).toBe('Sevilla');
    expect(zoneOf('Punta Umbría')).toBe('Huelva');
    expect(zoneOf('Rota')).toBe('Cádiz');
  });
  it('desconocido devuelve cadena vacía', () => {
    expect(zoneOf('Zaragoza')).toBe('');
  });
});

describe('coerceTravel', () => {
  it('valores razonables se redondean, locos van a la regla', () => {
    expect(coerceTravel('22.6', 'Sevilla', false)).toBe(23);
    expect(coerceTravel(999, 'Sevilla', false)).toBe(15);
    expect(coerceTravel(null, 'Huelva', false)).toBe(80);
    expect(coerceTravel(3, 'Sevilla', true)).toBe(60);
  });
});

describe('normTitle e isExcluded', () => {
  it('normaliza variantes de cartelera', () => {
    expect(normTitle('ODISEA (3D)')).toBe(normTitle('Odisea'));
  });
  it('excluye deporte, toros, religión y flamenco', () => {
    expect(isExcluded('Partido de baloncesto', '')).toBe(true);
    expect(isExcluded('Corrida de toros', '')).toBe(true);
    expect(isExcluded('Procesión del Miércoles', '')).toBe(true);
    expect(isExcluded('Noche de cante jondo', '')).toBe(true);
    expect(isExcluded('Exposición de Zurbarán', '')).toBe(false);
  });
});

describe('ventana anti-repetición y relleno del archivo', () => {
  const now = Date.parse('2026-09-20T12:00:00Z');
  const feeds = [
    { day: '2026-08-30', data: { places: [{ title: 'Viejo A' }], series: [{ title: 'Serie Vieja' }], movies: [] } },
    { day: '2026-09-06', data: { places: [{ title: 'Bar Uno' }, { title: 'Bar Dos' }], series: [{ title: 'Severance' }], movies: [{ title: 'Origen' }] } },
    { day: '2026-09-13', data: { places: [{ title: 'Bar Tres' }], series: [], movies: [] } }
  ];
  it('NO_REPEAT_DAYS son 14 (repetición permitida a la 3ª semana)', () => {
    expect(NO_REPEAT_DAYS).toBe(14);
  });
  it('recentFeedTitles junta solo los feeds de la ventana', () => {
    const sets = recentFeedTitles(feeds, now, 14);
    expect(sets.places.has('bar uno')).toBe(true);
    expect(sets.places.has('bar tres')).toBe(true);
    expect(sets.places.has('viejo a')).toBe(false); // 2026-08-30 ya fuera
    expect(sets.series.has('severance')).toBe(true);
    expect(sets.movies.has('origen')).toBe(true);
  });
  it('backfillFromArchive solo trae lo fuera de ventana y sin duplicar', () => {
    const banned = new Set(['bar uno']);
    const got = backfillFromArchive(feeds, 'places', banned, now, 5);
    expect(got.map((p) => p.title)).toEqual(['Viejo A']);
    const got2 = backfillFromArchive(feeds, 'places', new Set(['bar uno', 'viejo a']), now, 5);
    expect(got2).toEqual([]);
    expect(backfillFromArchive(feeds, 'places', new Set(), now, 0)).toEqual([]);
  });
  it('el archivo prefiere lo más reciente fuera de ventana', () => {
    const older = [
      { day: '2026-08-01', data: { places: [{ title: 'Antiguo' }] } },
      { day: '2026-09-01', data: { places: [{ title: 'Reciente-viejo' }] } }
    ];
    const got = backfillFromArchive(older, 'places', new Set(), now, 5);
    expect(got.map((p) => p.title)).toEqual(['Reciente-viejo', 'Antiguo']);
  });
});
