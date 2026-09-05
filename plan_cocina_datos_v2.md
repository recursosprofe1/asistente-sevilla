# Plan Cocina de Datos v2 — Asistente Sevilla
Fecha: 2026-09-05 | Estado: aprobado por dirección para pruebas | Coste: 0 € estricto

## 1. Visión del director
- Uso principal: decidir tranquilo. Primera versión: salir y ocio.
- Momento: cuando surja, sin rutina.
- Éxito: 1 plan bueno por semana.
- Usuario: solo yo de momento.
- Zona: Sevilla capital + provincia, Huelva y Cádiz (capital y provincia), costa y sierra.
- Hoy = planes de hoy guardados + marcados fijos para hoy.
- Filtro base 30 min pero libre (60 / sin límite para Huelva-Cádiz).
- Tipos: todos (música, teatro, rutas, gastro, arte, cine).
- Papelera 7 días bien. Actualización: automática como idea, manual en pruebas.
- Casa: en otra versión. Sus 17 tareas valen todas.
- Compras / Decisiones y plazos: se decide más tarde.
- Diseño: azul sereno de momento. Futuro: iconos y PNG propios con identidad única.
- Tarjetas: lectura actual bien. APK al final. Pruebas en navegador web.
- Arranque: cocina de datos primero.

## 2. Objetivo cocina v2
Cada semana, con botón manual, publicar:
- 15 Sevilla + 10 resto (Huelva/Cádiz) + 5 rutas = 30 planes.
- Reparto equitativo dentro de cada bloque (a fijar fino en pruebas).
- Cine aparte: cartelera íntegra Sevilla en 4 cines, sin duplicados.
- Excluidos siempre: deporte, toros, religioso. Precio da igual.

## 3. Dudas resueltas
1. **¿APK busca sin Tavily?** La APK nunca busca, solo lee el papel. Quien lee es la cocina (programa gratis Google) con lectura directa, sin IA ni Tavily. Tavily era solo un buscador opcional.
2. **Tavily y créditos:** básica = 1 crédito. Hoy 16/mes de 1.000. 50 páginas buscadas = 200/mes (seguiría gratis), pero leer directo = 0 créditos. Se quita Tavily para simplificar.
3. **Capas:** 1) Recoger (lectura directa gratis), 2) Chispa viva (Google interno), 3) Ordenar (IA). Una sola pasada, lo más sencillo posible.
4. **¿Por qué 12 y no 50?** Límite 6 min por ejecución. 50 de golpe se cuelga. 7-8 fijas bien elegidas + agregadores cubren los 30. Todas las semanas hay de todas las zonas (no semanas alternas).
5. **¿Gemini con Google a coste 0?** 2.5-flash: texto gratis + Google interno gratis hasta 500/día (usamos 1/semana). 3.5-flash: texto gratis pero su Google pide facturación. Por cero estricto sin líos: 2.5-flash.
6. **Modelo 2.0:** muerto el 01/06/2026 (verificado oficial). Hay que migrar a 2.5-flash. Sin esto la cocina está parada.
7. **Acierto:** sin porcentajes. El director prueba y dice si ve fallos.

## 4. Estructura simple aprobada (sin Tavily)
- Leer 7-8 páginas fijas directo (UrlFetchApp, coste 0).
- IA 2.5-flash solo ordena y normaliza, con su Google interno para lo vivo.
- Publica FeedV2 con generatedAt/validUntil/status/planes/cartelera.
- App sincroniza manual, avisa fallo + enseña anterior, fecha visible.
- Descartado no se repite. Aviso si exige reserva. Tiempo solo para filtro (+60 bucket, sin complicarse).
- Rutas sin fecha = evergreen, no caducan. Resto con lógica según tipo.
- Sin enlace vale pero raro (exigir https si viene).

## 5. Fuentes auditadas (por qué + scrapeabilidad)
- **ICAS agenda (icas.sevilla.org/agenda):** oficial Sevilla, mejor calidad fecha/lugar/categoría. HTML estático, se lee perfecto.
- **Agenda Cultural Andalucía Junta (filtros Sevilla/Huelva/Cádiz):** única con las 3 provincias mismo formato. Ideal 15+10. Se lee bien.
- **Sevilla.org agenda + iCal:** calendario descargable, fechas fiables.
- **Huelva agenda + Gran Teatro/Casa Colón (37 espectáculos/semestre):** oficial, vivo.
- **Cádiz agenda + Diputación Planeamos (455 acts):** oficial pueblos, novedad no-tópico.
- **Wikiloc + senderos Junta/Doñana/Sierra:** 5 rutas. Wikiloc a veces bloquea lectura → si una no se deja leer se descarta (regla director).
- **Cines (4):** Mk2 Nervión Plaza, Metromar, Avenida 5 Cines, Yelmo Lagoh. Carteleras públicas estables. Dedup por título normalizado. Respaldo eCartelera/SensaCine si una oficial cambia.
- Regla: si una no es scrapeable en pruebas, se descarta y se informa el porqué. No páginas al azar.

## 6. Reglas de publicación
- Cuotas: 15 Sevilla + 10 Huelva/Cádiz (5+5) + 5 rutas. Equitativo por gusto dentro.
- Filtros duros: sin deporte/toros/religioso. sourceUrl https si existe.
- expiresAt = endsAt o startsAt; rutas null (no caducan).
- travelMinutes simple: capital 15, provincia 30-45, Huelva/Cádiz 75-90 (>60).
- status ok/partial + quotasMissing + errores visibles en diagnóstico app.
- Manual en pruebas (ejecutarActualizacionSemanal + doGet). Nueva versión del despliegue tras cada cambio.

## 7. Pasos de pruebas (orden)
1. Cambiar GEMINI_MODEL 2.0 → 2.5-flash + diagnosticarGemini.
2. Quitar Tavily, lectura directa 7-8, prompt nuevo 30 + exclusiones.
3. Cine 4 fuentes + dedup. Rutas evergreen separadas.
4. Ejecución manual, revisar logs, desplegar nueva versión.
5. App web: sincronizar, comprobar 30, filtros 30/60/sin límite, Hoy fijo, papelera 7d, fecha visible, fallo con caché.

## 8. Riesgos
- Cocina parada hasta migrar modelo.
- Wikiloc / HTML cambiante → parcial + aviso (no rompe).
- Prompt 30 más grande → validar JSON estricto, no inventar precios/horarios ("Consultar").
- 6 min límite → 7-8 fuentes máx por pasada.

## 9. Criterios de prueba superada
- 30 aprox con 15+10+5, todas las zonas cada semana.
- Cine 4 sin duplicados. Rutas sin fecha visibles.
- Sincronización manual OK, diagnóstico con fecha, caché si falla.
- Cero descartados repetidos. Cero deporte/toros/religioso.
- Coste 0 verificado (sin Tavily, 2.5-flash gratis).

## 10. Implementado 2026-09-05 (pendiente desplegar en Google)
- `apps-script/Code.gs` reescrito a v4: modelo `gemini-2.5-flash`, Tavily
  eliminado, 8 fuentes fijas con lectura directa, prompt 30 (15+10+5),
  exclusiones con doble barrera, cine 4 salas con dedup por título,
  rutas evergreen (expiresAt null), travelMinutes por regla simple.
  Sintaxis verificada con `node --check` (OK).
- `src/services/feedService.js`: rutas sin fecha muestran "Sin fecha fija"
  y no caducan (expiresAt null → se conservan).
- `npm run build` OK (dist regenerado).
- NO puedo entrar en tu cuenta Google: te toca pegar el archivo y desplegar.

## 11. Lo que tienes que hacer tú (5 min, una vez)
1. Abre script.google.com → proyecto "Asistente_Personal_Backend".
2. Sustituye todo el código por el contenido de `apps-script/Code.gs`.
3. Comprueba propiedad `GEMINI_KEY` (y opcional `GEMINI_MODEL=gemini-2.5-flash`).
   `TAVILY_KEY` ya no se usa, la puedes borrar.
4. Ejecuta `ejecutarActualizacionSemanal` → lee el registro (debe decir
   "Feed: ~30 planes…"). Si una fuente falla, sale en Avisos: dime cuál y
   corrijo su URL (las 4 de cines nuevas pueden necesitar ajuste).
5. Desplegar → Gestionar despliegues → lápiz → Nueva versión.
6. En la app web pulsa sincronizar y revisa el Diagnóstico.

## 12. Mudanza a GitHub (2026-09-05, verificado)
- Adiós Google Scripts para la cocina: `scripts/build-feed.mjs` (Node, sin
  dependencias) + `.github/workflows/feed.yml` (auto en cada subida + botón
  manual + semanal apagado hasta el OK).
- Web de pruebas auto: `.github/workflows/preview.yml` → URL fija
  `https://recursosprofe1.github.io/asistente-sevilla/` (falta 1 clic:
  Settings → Pages → Source: GitHub Actions). `vite.config.js` con `base './'`.
- Modelo: `gemini-3.6-flash` (2.0 muerto + 2.x bloqueado a cuentas nuevas,
  verificado con el error real del robot) + cadena de repuesto automática
  (3.5-flash → 3.1-flash-lite) + clave por cabecera (no sale en registros).
- Cada ejecución deja `feeds/feed-latest.json` + parte `feeds/last-run.md`
  (legibles sin entrar en GitHub); el commit del robot lleva `[skip ci]`
  para no re-ejecutarse en bucle.
- Pool en `pool_fuentes_50.md`: 8 fijas + rotativas A/B/C/D.
  Verificación real de lectura: A 26/26 · B 23/23 · C 22/22 · D 21/21.
  Caídas sustituidas (Wikiloc, cines oficiales, museos, FIT/South, CaixaForum…).
- Cines finales: los 4 pedidos vía eCartelera + dedup por título.
- Excluidos: deporte, toros, religioso y flamenco (dirección).
- Pendiente del director: pegar llave de despliegue (Settings → Deploy keys)
  + activar Pages. Después: primera subida mía, prueba auto y cambio de
  dirección en la app a `feeds/feed-latest.json`.
