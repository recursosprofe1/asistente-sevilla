import { describe, it, expect } from 'vitest';
import { normalizeCategory, sortCategories } from '../src/utils/planCategories';
import { parseSpanishExpiresAt, stablePlanId, planSignature, feedHashOf } from '../src/services/feedService';
import { normalizeSerie, normalizePlace, getTasteProfile, syncRecosFromFeed } from '../src/services/recoService';
import { pickRepesca, isRepescable, REPESCA_AFTER_MS } from '../src/utils/repesca';

describe('normalizeCategory', () => {
  it('acepta arrays del contrato FeedV2', () => {
    expect(normalizeCategory(['Música'])).toBe('Música');
  });
  it('ignora Varios y reclasifica por el hint', () => {
    expect(normalizeCategory('Varios', 'Taller de cerámica en Triana')).toBe('Arte');
  });
  it('el hint no manda a Cine (vive en su pestaña)', () => {
    expect(normalizeCategory('Varios', 'Ciclo de cine de autor')).not.toBe('Cine');
  });
  it('fallback Arte cuando nada casa', () => {
    expect(normalizeCategory('Varios', 'Algo raro')).toBe('Arte');
    expect(normalizeCategory('')).toBe('Arte');
  });
  it('la etiqueta directa sí puede ser Cine', () => {
    expect(normalizeCategory('Cine')).toBe('Cine');
  });
});

describe('sortCategories', () => {
  it('respeta el orden canónico', () => {
    expect(sortCategories(['Arte', 'Rutas y naturaleza', 'Música'])).toEqual([
      'Rutas y naturaleza', 'Música', 'Arte'
    ]);
  });
});

describe('parseSpanishExpiresAt', () => {
  const now = new Date('2026-09-06T12:00:00+02:00').getTime();
  it('rango "Del 2 al 6 de septiembre" caduca al cerrar el 6', () => {
    const t = parseSpanishExpiresAt('Del 2 al 6 de septiembre de 2026', now);
    expect(new Date(t).getFullYear()).toBe(2026);
    expect(new Date(t).getMonth()).toBe(8);
    expect(new Date(t).getDate()).toBe(6);
  });
  it('"Próximamente" o "por consultar" no caducan', () => {
    expect(parseSpanishExpiresAt('Próximamente', now)).toBeNull();
    expect(parseSpanishExpiresAt('Por consultar', now)).toBeNull();
  });
  it('fecha pasada este año salta al año siguiente', () => {
    const t = parseSpanishExpiresAt('15 de marzo', now);
    expect(new Date(t).getFullYear()).toBe(2027);
  });
});

describe('stablePlanId y planSignature', () => {
  it('IDs sin índice: estable aunque reordene el feed', () => {
    const p = { title: 'Concierto', sourceUrl: 'https://x.es/a', startsAt: '2026-09-12', venue: 'Círculo' };
    expect(stablePlanId(p)).toBe(stablePlanId({ ...p }));
    expect(stablePlanId(p)).toMatch(/^remote-plan-/);
  });
  it('la firma ignora campos locales', () => {
    const p = { title: 'A', venue: 'V' };
    expect(planSignature(p)).toBe(planSignature({ ...p, lastSeenAt: 123, userStatus: 'interested' }));
  });
  it('feedHash determinista', () => {
    expect(feedHashOf('hola')).toBe(feedHashOf('hola'));
    expect(feedHashOf('hola')).not.toBe(feedHashOf('adiós'));
  });
});

describe('recoService', () => {
  it('IDs de recos estables y prefijados', () => {
    const s = normalizeSerie({ title: 'Severance', year: 2022 }, 1);
    expect(s.id).toMatch(/^serie-/);
    expect(normalizePlace({ name: 'Bar Juan', cuisine: 'Andaluza' }, 1).id).toMatch(/^place-/);
  });
  it('descarta URLs que no sean https', () => {
    expect(normalizeSerie({ title: 'X', sourceUrl: 'http://no-seguro.es' }, 1).sourceUrl).toBe('');
    expect(normalizeSerie({ title: 'X', sourceUrl: 'https://seguro.es' }, 1).sourceUrl).toBe('https://seguro.es');
  });
  it('getTasteProfile aprende likes/avoids de las tablas', async () => {
    const now = Date.now();
    const rows = {
      series: [
        { userStatus: 'interested', genres: ['Ciencia ficción'], interestedAt: now - 2 * 86400000 },
        { userStatus: 'interested', genres: ['Ciencia ficción'], interestedAt: now - 3 * 86400000 },
        { userStatus: 'discarded', discardReason: 'disliked', genres: ['Terror'], discardedAt: now - 86400000 }
      ],
      movies: [],
      places: []
    };
    const fakeDb = { table: (t) => ({ toArray: async () => rows[t] }) };
    const profile = await getTasteProfile(fakeDb, now);
    expect(profile.series.learnedLikes?.[0]).toMatch(/^Ciencia ficción x2$/);
    expect(profile.series.learnedAvoid?.[0]).toMatch(/^Terror/);
  });
});

function fakeRecoDb() {
  const tables = {};
  const forName = (name) => {
    if (!tables[name]) {
      const rows = new Map();
      tables[name] = {
        toArray: async () => [...rows.values()],
        bulkPut: async (items) => { for (const i of items) rows.set(i.id, { ...(rows.get(i.id) || {}), ...i }); },
        update: async (id, patch) => { rows.set(id, { ...(rows.get(id) || {}), ...patch }); },
        get: async (id) => rows.get(id),
        _rows: rows
      };
    }
    return tables[name];
  };
  return { table: forName, _tables: tables };
}

const visibleLike = (r) => !(r.reserve === true || r.seenAt || r.userStatus === 'discarded' || r.status === 'discarded' || r.feedStatus === 'expired' || r.feedStatus === 'removed');

describe('syncRecosFromFeed: invariantes del usuario', () => {
  const feed = [
    { title: 'Bar Uno', cuisine: 'Andaluza', zone: 'Centro', sourceUrl: 'https://a.es' },
    { title: 'Bar Dos', cuisine: 'Asiática', zone: 'Triana', sourceUrl: 'https://b.es' }
  ];
  it('propaga reserve del JSON al registro local', async () => {
    const db = fakeRecoDb();
    await syncRecosFromFeed(db, 'places', normalizePlace, [{ ...feed[0], reserve: true }, feed[1]]);
    const rows = await db.table('places').toArray();
    expect(rows.find((r) => r.title === 'Bar Uno').reserve).toBe(true);
    expect(rows.find((r) => r.title === 'Bar Dos').reserve).toBe(false);
  });
  it('un descartado que reaparece en el feed sigue vetado', async () => {
    const db = fakeRecoDb();
    await syncRecosFromFeed(db, 'places', normalizePlace, feed);
    const id = (await db.table('places').toArray())[0].id;
    await db.table('places').update(id, { userStatus: 'discarded', status: 'discarded', discardReason: 'disliked' });
    await syncRecosFromFeed(db, 'places', normalizePlace, feed); // siguiente semana, mismo título
    const vetoed = (await db.table('places').toArray()).find((r) => r.id === id);
    expect(vetoed.userStatus).toBe('discarded');
    expect(visibleLike(vetoed)).toBe(false);
  });
  it('una visita guardada no resucita con la resincronización', async () => {
    const db = fakeRecoDb();
    await syncRecosFromFeed(db, 'places', normalizePlace, feed);
    const row = (await db.table('places').toArray())[0];
    await db.table('places').update(row.id, { seenAt: 123 });
    await syncRecosFromFeed(db, 'places', normalizePlace, feed);
    const kept = (await db.table('places').toArray()).find((r) => r.id === row.id);
    expect(kept.seenAt).toBe(123);
    expect(visibleLike(kept)).toBe(false);
  });
});

describe('repesca (¿Repetimos?)', () => {
  const day = 86400000;
  it('nada elegible antes de 30 días', () => {
    const now = 1000 * day;
    expect(isRepescable({ seenAt: now - 29 * day }, now)).toBe(false);
    expect(pickRepesca([{ seenAt: now - 29 * day }], 5, now)).toBeNull();
  });
  it('elige una sola y rota de forma determinista por semana ISO', () => {
    const now = 1000 * day;
    const cands = [
      { id: 'a', seenAt: now - 31 * day },
      { id: 'b', seenAt: now - 40 * day },
      { id: 'c', seenAt: now - 60 * day }
    ];
    const w1 = pickRepesca(cands, 1, now);
    const w2 = pickRepesca(cands, 2, now);
    expect([w1.id, w2.id]).not.toEqual([]);
    // Orden por seenAt ascendente: [c, b, a]; semana 1 → b, semana 2 → a, semana 0 → c.
    expect(pickRepesca(cands, 0, now).id).toBe('c');
    expect(w1.id).toBe('b');
    expect(w2.id).toBe('a');
  });
  it('sin vistas no hay repesca', () => {
    expect(pickRepesca([], 7, Date.now())).toBeNull();
    expect(pickRepesca([{ id: 'x' }], 7, Date.now())).toBeNull();
  });
  it('la ventana de repesca es de 30 días', () => {
    expect(REPESCA_AFTER_MS).toBe(30 * 86400000);
  });
});
