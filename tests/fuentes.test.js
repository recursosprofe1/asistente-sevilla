import { describe, it, expect } from 'vitest';
import { seedEstado, cargarEstado, fuentesActivas, aplicarResultado, huecosVacantes, parseCandidatos, darDeAlta } from '../scripts/build-feed.mjs';

describe('censo de fuentes (fuentes-estado)', () => {
  it('la semilla arranca toda fuente como activa', () => {
    const e = seedEstado();
    const urls = Object.keys(e.sources);
    expect(urls.length).toBeGreaterThan(20);
    expect(urls.every((u) => e.sources[u].state === 'activa')).toBe(true);
  });

  it('fuentesActivas excluye jubiladas y filtra por grupo', () => {
    const e = seedEstado();
    const alguna = Object.keys(e.sources).find((u) => e.sources[u].grupo === 'B');
    e.sources[alguna].state = 'baja';
    const { fijas, rotativas } = fuentesActivas(e, 'B');
    expect(rotativas.some((s) => s.url === alguna)).toBe(false);
    expect(fijas.length).toBeGreaterThan(0);
  });

  it('2 fallos seguidos jubil a una fuente activa', () => {
    const e = seedEstado();
    const u = Object.keys(e.sources)[0];
    expect(aplicarResultado(e, u, false, 'fetch failed')).toBeNull(); // 1er fallo: avisa
    expect(aplicarResultado(e, u, false, 'fetch failed')).toBe('jubilacion'); // 2º: a paco
    expect(e.sources[u].state).toBe('baja');
  });

  it('un OK resetea la racha de fallos (no se jubila por intermitente suelto)', () => {
    const e = seedEstado();
    const u = Object.keys(e.sources)[0];
    aplicarResultado(e, u, false, 'boom');
    aplicarResultado(e, u, true);
    const acc = aplicarResultado(e, u, false, 'boom');
    expect(acc).not.toBe('jubilacion');
  });

  it('una ensayo asciende a activa a las 2 lecturas OK', () => {
    const e = seedEstado();
    const u = Object.keys(e.sources)[0];
    e.sources[u].state = 'ensayo';
    aplicarResultado(e, u, true);
    expect(aplicarResultado(e, u, true)).toBe('promocion');
    expect(e.sources[u].state).toBe('activa');
  });

  it('una ensayo aguanta hasta 3 fallos antes de morir', () => {
    const e = seedEstado();
    const u = Object.keys(e.sources)[0];
    e.sources[u].state = 'ensayo';
    expect(aplicarResultado(e, u, false, 'x')).toBeNull();
    expect(aplicarResultado(e, u, false, 'x')).toBeNull();
    expect(aplicarResultado(e, u, false, 'x')).toBe('jubilacion');
  });

  it('hueco vacante = baja sin reemplazo, y Cine nunca se busca solo', () => {
    const e = seedEstado();
    const u = Object.keys(e.sources)[0];
    e.sources[u].state = 'baja';
    expect(huecosVacantes(e).map(([url]) => url)).toContain(u);
    e.sources[u].reemplazadoPor = 'https://nueva.es';
    expect(huecosVacantes(e).map(([url]) => url)).not.toContain(u);
  });

  it('darDeAlta crea ensayo, marca la baja como reemplazada y hereda zona/grupo', () => {
    const e = seedEstado();
    const u = Object.keys(e.sources)[0];
    const meta = { ...e.sources[u] };
    e.sources[u].state = 'baja';
    const altas = [];
    darDeAlta(e, u, meta, { nombre: 'Nueva Fuente', url: 'https://nueva.es', zona: meta.zona }, altas);
    expect(altas).toEqual(['Nueva Fuente']);
    expect(e.sources[u].reemplazadoPor).toBe('https://nueva.es');
    expect(e.sources['https://nueva.es'].state).toBe('ensayo');
    expect(e.sources['https://nueva.es'].grupo).toBe(meta.grupo);
    expect(e.sources['https://nueva.es'].zona).toBe(meta.zona);
  });
});

describe('parseCandidatos (respaldo IA)', () => {
  it('acepta JSON limpio con candidatos válidos', () => {
    const txt = '{"candidatos":[{"nombre":"Agenda Lucena","url":"https://lucena.es/agenda","zona":"Sevilla"},{"nombre":"Bad","url":"http://no-https.es","zona":"Sevilla"}]}';
    const got = parseCandidatos(txt);
    expect(got).toHaveLength(1);
    expect(got[0].url).toBe('https://lucena.es/agenda');
  });
  it('tolera markdown y basura sin reventar', () => {
    expect(parseCandidatos('```json\n{"candidatos":[{"nombre":"X","url":"https://x.es/a","zona":"Huelva"}]}\n```')).toHaveLength(1);
    expect(parseCandidatos('no es json')).toEqual([]);
    expect(parseCandidatos('{"nada": 1}')).toEqual([]);
  });
});
