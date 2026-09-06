import { describe, it, expect } from 'vitest';
import { decayWeight, decisionTimeMs, weightedTopTags, formatTagScore, parseTagScore, FULL_WEIGHT_DAYS, MIN_WEIGHT } from '../src/utils/tasteLearning';
import { getTasteProfile } from '../src/services/recoService';
import { buildProfilePayload, profileHash, encodeB64, uploadProfile, quizáSubirPerfil } from '../src/services/profileSync';

const DIA = 86400000;
const NOW = Date.UTC(2026, 8, 6); // 2026-09-06

describe('decayWeight (memoria que se desvanece, nunca borrosa)', () => {
  it('dentro de 6 meses pesa al completo', () => {
    expect(decayWeight(0)).toBe(1);
    expect(decayWeight(FULL_WEIGHT_DAYS)).toBe(1);
  });
  it('decae de forma gradual tras 6 meses', () => {
    const aUnAnio = decayWeight(FULL_WEIGHT_DAYS + 180);
    expect(aUnAnio).toBeCloseTo(0.5, 1);
    expect(aUnAnio).toBeLessThan(decayWeight(200));
  });
  it('nunca llega a cero (suelo)', () => {
    expect(decayWeight(3650)).toBe(MIN_WEIGHT);
    expect(decayWeight(99999)).toBeGreaterThanOrEqual(MIN_WEIGHT);
  });
});

describe('weightedTopTags', () => {
  it('da más peso a las decisiones recientes', () => {
    const items = [
      { genres: ['Drama'], interestedAt: NOW - 5 * DIA },   // reciente, x1
      { genres: ['Drama'], interestedAt: NOW - 5 * DIA },   // reciente, x1
      { genres: ['Comedia'], interestedAt: NOW - 400 * DIA } // antiguo, ~0.4
    ];
    const top = weightedTopTags(items, 'genres', NOW);
    expect(top[0].tag).toBe('Drama');
    expect(top[0].score).toBe(2);
    expect(top.find((t) => t.tag === 'Comedia').score).toBeLessThan(1);
  });
  it('usa la última señal del registro (descartar manda sobre marcar)', () => {
    const r = { genres: ['Terror'], interestedAt: NOW - 10 * DIA, discardedAt: NOW - 1 * DIA };
    expect(decisionTimeMs(r)).toBe(NOW - 1 * DIA);
  });
  it('formato xN y parseo ida-vuelta', () => {
    expect(formatTagScore({ tag: 'Drama', score: 2 })).toBe('Drama x2');
    expect(formatTagScore({ tag: 'Drama', score: 1.5 })).toBe('Drama x1.5');
    expect(parseTagScore('Drama x1.5')).toEqual({ tag: 'Drama', score: 1.5 });
    expect(parseTagScore('Sin Numero').score).toBe(1);
  });
});

describe('getTasteProfile ponderado', () => {
  const fakeDb = (rows) => ({ table: (t) => ({ toArray: async () => rows[t] }) });
  it('aprende likes y avoids con pesos', async () => {
    const rows = {
      series: [
        { userStatus: 'interested', genres: ['Ciencia ficción'], interestedAt: NOW - 2 * DIA },
        { userStatus: 'interested', genres: ['Ciencia ficción'], interestedAt: NOW - 3 * DIA },
        { userStatus: 'discarded', discardReason: 'disliked', genres: ['Terror'], discardedAt: NOW - 1 * DIA }
      ],
      movies: [], places: []
    };
    const p = await getTasteProfile(fakeDb(rows), NOW);
    expect(p.series.learnedLikes[0]).toBe('Ciencia ficción x2');
    expect(p.series.learnedAvoid[0]).toBe('Terror x1');
  });
});

describe('profileSync: payload y hash', () => {
  const profile = {
    series: { learnedLikes: ['Drama x3'], learnedAvoid: ['Terror x1'] },
    movies: { learnedLikes: ['Thriller x2'], learnedAvoid: [] },
    food: { learnedLikes: ['Andaluza x5'], learnedAvoid: [], learnedZones: ['Triana'] }
  };
  it('el hash ignora la marca de tiempo (solo cambia si cambian los gustos)', () => {
    const a = buildProfilePayload(profile, new Date(NOW));
    const b = buildProfilePayload(profile, new Date(NOW + 86400000));
    expect(profileHash(a)).toBe(profileHash(b));
    const c = buildProfilePayload({ ...profile, series: { learnedLikes: ['Drama x9'], learnedAvoid: [] } }, new Date(NOW));
    expect(profileHash(c)).not.toBe(profileHash(a));
  });
  it('nunca viajan títulos: solo etiquetas', () => {
    const payload = buildProfilePayload(profile, new Date(NOW));
    expect(JSON.stringify(payload)).not.toMatch(/interested|discarded|discardedAt/);
    expect(payload.food.learnedZones).toEqual(['Triana']);
  });
  it('encodeB64 produce UTF-8 base64 correcto (con ñ y acentos)', () => {
    const b64 = encodeB64({ 'Compañía': 'Bodeguita' });
    const decoded = JSON.parse(new TextDecoder().decode(new Uint8Array([...atob(b64)].map((c) => c.charCodeAt(0)))));
    expect(decoded['Compañía']).toBe('Bodeguita');
  });
});

describe('uploadProfile contra la API simulada', () => {
  const mkFetch = ({ get = { status: 404 }, put = { ok: true, status: 201 } } = {}) => {
    const calls = [];
    const f = async (url, opts) => {
      calls.push({ url, opts });
      if ((opts?.method || 'GET') === 'GET') return { status: get.status, json: async () => get.body || {} };
      return { ok: put.ok, status: put.status, text: async () => put.text || '' };
    };
    f.calls = calls;
    return f;
  };
  it('crea sin sha cuando no existe perfil.json', async () => {
    const fetchImpl = mkFetch();
    const res = await uploadProfile({ token: 't', payload: { schemaVersion: 1 }, fetchImpl });
    expect(res.ok).toBe(true);
    const put = fetchImpl.calls.find((c) => c.opts?.method === 'PUT');
    const body = JSON.parse(put.opts.body);
    expect(body.sha).toBeUndefined();
    expect(put.opts.headers.Authorization).toBe('Bearer t');
  });
  it('envía el sha previo si el fichero ya existía', async () => {
    const fetchImpl = mkFetch({ get: { status: 200, body: { sha: 'abc123' } } });
    const res = await uploadProfile({ token: 't', payload: {}, fetchImpl });
    expect(res.ok).toBe(true);
    const body = JSON.parse(fetchImpl.calls.find((c) => c.opts?.method === 'PUT').opts.body);
    expect(body.sha).toBe('abc123');
  });
  it('reporta error si el PUT falla (500)', async () => {
    const fetchImpl = mkFetch({ put: { ok: false, status: 500, text: 'boom' } });
    const res = await uploadProfile({ token: 't', payload: {}, fetchImpl });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/500/);
  });
});

describe('quizáSubirPerfil: throttle y guardas', () => {
  const mkDb = (prefs) => ({
    preferences: {
      get: async (k) => prefs[k],
      put: async (o) => { prefs[o.key] = o; },
      delete: async (k) => { delete prefs[k]; }
    },
    table: () => ({ toArray: async () => [] })
  });
  it('sin token no intenta nada', async () => {
    const res = await quizáSubirPerfil(mkDb({}), { now: new Date(NOW) });
    expect(res).toEqual({ skipped: 'sin-token' });
  });
  it('no repite si el perfil no cambió (throttle por hash)', async () => {
    const payload = buildProfilePayload({ series: {}, movies: {}, food: {} }, new Date(NOW));
    const h = profileHash(payload);
    const prefs = {
      ghToken: { key: 'ghToken', value: 'tok' },
      profileSync: { key: 'profileSync', value: { lastHash: h, lastAt: NOW - DIA, lastOk: true } }
    };
    // getTasteProfile con tablas vacías → payload con arrays vacíos → mismo hash
    const res = await quizáSubirPerfil(mkDb(prefs), { now: new Date(NOW), fetchImpl: () => { throw new Error('no debería llamar'); } });
    expect(res).toEqual({ skipped: 'sin-cambios' });
  });
});
