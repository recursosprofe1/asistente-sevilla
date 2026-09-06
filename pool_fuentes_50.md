# Pool de fuentes — Asistente Sevilla
Fecha: 2026-09-05 | Estado: VERIFICADO lectura OK A 26/26 · B 23/23 · C 22/22 · D 21/21
Reparto: 25 Sevilla + 6 Huelva + 6 Cádiz + 7 rutas en pool rotativo + 8 fijas
(todas las semanas, todas las zonas; el equilibrio 15+10+5 lo garantiza el prompt).
Excluidos de todo: deporte, toros, religioso y flamenco.

## Cómo rota
- **Fijas (8, todas las semanas):** ICAS agenda, Agenda Junta Sevilla, Ayto Sevilla agenda,
  Agenda Junta Huelva, Huelva costa Ayamonte, Agenda Junta Cádiz, Agenda Cádiz capital,
  Vías Verdes (rutas). (huelva.es bloquea al robot: sustituida por Ayamonte.)
- **Rotativas del pool según grupo A/B/C/D** por nº de semana ISO (o `FEED_GROUP` a mano
  en el botón manual). Ciclo completo en un mes.
- Fija Huelva capital: portal de cultura (la agenda huelva.es bloquea al robot).
- **Caídas en verificación y sustituidas:** Wikiloc x3 (403 anti-robots), FIT Cádiz y South
  Series (503), webs oficiales de cines (403/errores), GR-48/fedamon (403), CaixaForum (403),
  dominio museosdeandalucia caído, Fundición, Sala X, Mercado Triana, Riberas, Carmona,
  turismosevilla, turismohuelva, Casa Colón, Aracena, Metromar/Mk2/Avenida oficiales
  (sin respuesta). Sustitutas verificadas abajo. El modo `--check-sources` re-verifica
  los 4 grupos cuando se quiera.

## SEVILLA (25)
| Fuente | URL | Grupo | Por qué |
|--------|-----|-------|---------|
| Teatro Lope de Vega | https://www.sevilla.org/teatro-lope-de-vega/eventos | A | Grande municipal, fechas claras |
| Sala Cero Teatro | https://salacero.com/programacion-salacero/ | A | Alternativa íntima centro (la home www da capa JS al runner; la programación, no) |
| ROSS | https://www.rossevilla.es/ | A | Sinfónica propia |
| Junta expos Sevilla | https://www.juntadeandalucia.es/cultura/agendaculturaldeandalucia/actividades/exposiciones-en-sevilla | A | Temporales oficiales |
| Santa Clara | https://icas.sevilla.org/espacios/espacio-santa-clara | A | Emergente y ciclos |
| Lebrija | https://www.lebrija.es/ | A | Provincia Bajo Guadalquivir |
| Visita Sevilla | https://visitasevilla.es/ | A | Turismo oficial, rutas y gastro |
| Santiponce (Junta) | https://www.juntadeandalucia.es/cultura/agendaculturaldeandalucia/actividades/santiponce | A | Itálica y entorno |
| Agenda Sevilla | https://www.agendadesevilla.com/ | B | Agregador vivo general |
| Fundación Cajasol | https://fundacioncajasol.com/ | B | Conciertos y expos |
| Sala Custom | https://www.salacustom.com/ | B | Rock y directo medio |
| Agenda expos | https://www.agendadesevilla.com/exposiciones/ | B | Exposiciones agregadas |
| Atín Aya | https://icas.sevilla.org/espacios/atin-aya | B | Foto y ciudad |
| Teatro Sevilla (agenda) | https://www.agendadesevilla.com/teatro/ | B | Sustituye a Teatro Central (ficha fina) |
| Teatro Alameda | https://icas.sevilla.org/espacios/teatro-alameda | C | Familiar y alternativo |
| Cartuja Center | https://cartujacenter.com/ | C | Musicales y comedia |
| Conciertos Sevilla | https://www.agendadesevilla.com/conciertos/ | C | Sustituye a Acuario (sin verificar) |
| Antiquarium | https://icas.sevilla.org/espacios/antiquarium | C | Arqueología urbana |
| Lonja del Barranco | https://www.mercadodelbarranco.com/ | C | Gourmet junto al río |
| Santiponce Ayto | https://www.santiponce.es/ | C | Provincia cercana |
| Maestranza | https://www.teatrodelamaestranza.es/temporadas/ | D | Ópera y clásica grande |
| Espacio Turina | https://icas.sevilla.org/espacios/espacio-turina | D | Clásica y antigua estable |
| Visita Sevilla (refuerzo) | https://visitasevilla.es/ | D | Turismo oficial |
| Osuna | https://www.osuna.es/ | D | Provincia, colegiata y barroco |
| Cerámica Triana | https://icas.sevilla.org/espacios/centro-ceramica | D | Artesanía y barrio |

## HUELVA (6)
| Fuente | URL | Grupo | Por qué |
|--------|-----|-------|---------|
| entradas.huelva.es | https://entradas.huelva.es/ | A | Gran Teatro + Colón con precio |
| Diputación Huelva | https://www.diphuelva.es/cultura/ | A | Pueblos y condado (404 intermitente al runner: fetchText prueba UA navegador e index.html) |
| Moguer (Junta) | https://www.juntadeandalucia.es/cultura/agendaculturaldeandalucia/actividades/moguer | B | Huelva, fiable Junta |
| Almonte (Junta) | https://www.juntadeandalucia.es/cultura/agendaculturaldeandalucia/actividades/almonte | B | Huelva, fiable Junta |
| Aracena (Junta) | https://www.juntadeandalucia.es/cultura/agendaculturaldeandalucia/actividades/aracena | C | Sierra |
| Punta Umbría (Junta) | https://www.juntadeandalucia.es/cultura/agendaculturaldeandalucia/actividades/punta-umbria | D | Costa |

## CÁDIZ (6)
| Fuente | URL | Grupo | Por qué |
|--------|-----|-------|---------|
| Gran Teatro Falla | https://laciudad.cadiz.es/programacion-gran-teatro-falla.asp | A | Tabla de fechas |
| Cádiz programación | https://institucional.cadiz.es/programacion_cultural | A | Agenda capital |
| Casa Iberoamérica | https://institucional.cadiz.es/area/Casa-de-Iberoamerica | B | Expos y ciclos |
| Jerez (Junta) | https://www.juntadeandalucia.es/cultura/agendaculturaldeandalucia/actividades/jerez-de-la-frontera | B | Cádiz, fiable Junta |
| Baluarte Candelaria | https://institucional.cadiz.es/area/Baluarte-de-la-Candelaria | C | Expos y ciclos |
| Planeamos Diputación | https://www.dipucadiz.es/cultura/Varios/planeamos-2026/ | D | 455 acts pueblos, no-tópico |
| Diputación Cádiz | https://www.dipucadiz.es/ | D | Sustituye a La Ciudad (ficha fina) |
| Rota (Junta) | https://www.juntadeandalucia.es/cultura/agendaculturaldeandalucia/actividades/rota | D | Cádiz costa, fiable Junta |

## RUTAS (8 + Vías Verdes en fijas)
| Fuente | URL | Grupo | Por qué |
|--------|-----|-------|---------|
| Sierra Norte senderos | https://www.sierranortedesevilla.es/actividades/senderismo/senderos-sierra-norte-de-sevilla.html | A | 18 rutas con detalle |
| Castañares Constantina | https://www.juntadeandalucia.es/medioambiente/portal/web/ventanadelvisitante/detalle-buscador-mapa/-/asset_publisher/Jlbxh2qB3NwR/content/los-casta%C3%B1ares/255035 | A | Otoño, ficha oficial |
| Cazalla senderos | https://www.cazalla.org/senderos/ | B | Sierra Norte pueblo a pueblo |
| Doñana (Ministerio) | https://www.miteco.gob.es/es/parques-nacionales-oapn/red-parques-nacionales/parques-nacionales/donana.html | B | Marisma, las 3 provincias |
| Grazalema (Ventana) | https://www.juntadeandalucia.es/medioambiente/portal/web/ventanadelvisitante/detalle-buscador-mapa/-/asset_publisher/Jlbxh2qB3NwR/content/sierra-de-grazalema/255035 | C | Pinsapar, ficha oficial |
| Doñana itinerarios | https://www.miteco.gob.es/eu/parques-nacionales-oapn/red-parques-nacionales/parques-nacionales/donana/guia-visitante/itinerarios.html | C | Rutas guiadas |
| Sierra Norte (Ventana) | https://www.juntadeandalucia.es/medioambiente/portal/web/ventanadelvisitante/detalle-buscador-mapa/-/asset_publisher/Jlbxh2qB3NwR/content/sierra-norte-de-sevilla/255035 | D | Ficha oficial |

## Cines (siempre los 4, dedup por título; lector con doble estrategia + respaldo a la anterior si el día sale flojo)
- Yelmo Lagoh — https://www.ecartelera.com/cines/yelmo-cines-premium-lagoh/
- Cinesur Nervión — https://www.ecartelera.com/cines/446,0,1.html
- Avenida 5 Cines — https://www.ecartelera.com/cines/149,0,1.html
- Metromar — https://www.ecartelera.com/cines/576,0,1.html
