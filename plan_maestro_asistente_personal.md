# Plan Maestro del Proyecto: Asistente Personal Proactivo para Android

## 1. Resumen Ejecutivo y Misión del Proyecto

### 1.1 Objetivo
Construir un **Asistente Personal Proactivo** en formato de aplicación nativa Android (instalable mediante APK firmado), con una estética visual de alta gama, cálida y editorial. El sistema actuará como un filtro inteligente de bolsillo para la vida cotidiana y doméstica, libre de la saturación de las listas de tareas tradicionales y de la fricción de los chatbots textuales.

### 1.2 Principio Fundamental de Diseño
> **"El asistente trabaja para el usuario, no el usuario para mantener el asistente."**

* **Acción por encima de la administración:** Interacción mediante tarjetas visuales con botones de un solo toque (*"Me interesa"*, *"Descartar"*, *"Posponer"*, *"Hecho"*, *"Observar"*).
* **Cero sobrecarga cognitiva:** Cero scroll infinito, cero bandejas de entrada abarrotadas, sin notificaciones invasivas ni categorizaciones complejas.
* **Inteligencia en segundo plano:** La IA busca, procesa, filtra y estructura; la aplicación muestra únicamente recomendaciones oportunas y condensadas.

---

## 2. Arquitectura de Coste 0 € y Decisiones Cerradas

El proyecto está diseñado bajo una restricción estricta de **0 € de coste continuo**, sin depender de suscripciones a API de pago, servidores ni servicios cloud de pago.

```text
[Fuentes Públicas / Agendas / Gmail]
                   ↓
   [Google Apps Script (Semanal)] ───► [Gemini API Free Tier (Procesamiento Semántico)]
                   ↓
        [Google Sheet Privado]
                   ↓
      [Feed JSON Público Anónimo]
                   ↓
   [App Android (React + Capacitor)] ◄──► [IndexedDB Local (Dexie.js - Datos Privados)]
```

### 2.1 Decisiones Arquitectónicas
1. **Plataforma Única:** Aplicación Android nativa compilada vía Capacitor a partir de un proyecto React + TypeScript + Vite. Instalación manual mediante APK firmado.
2. **Backend Gratuito:** Google Apps Script ejecutado de forma programada los miércoles por la mañana, usando Google Sheets como almacenamiento de persistencia intermedia.
3. **Capa de Inteligencia Gratuita:** API de Gemini (modelo Flash) en su nivel gratuito (*Free Tier* a través de Google AI Studio, con soporte nativo para *Search Grounding*).
4. **Privacidad y Aislamiento:** El feed remoto únicamente transmite datos públicos (eventos, sugerencias). Las compras, decisiones, estado de tareas domésticas y preferencias locales **nunca salen del móvil** (almacenamiento en IndexedDB mediante Dexie.js).
5. **Comprobación Pasiva de Datos:** La app no ejecuta procesos pesados en segundo plano. Comprueba la validez de la caché al abrirse y conserva la última versión válida si no hay conexión.

---

## 3. Especificación Detallada de los 4 Módulos

### 3.1 Módulo 1: Planes Cercanos
* **Propósito:** Descubrir eventos culturales, actividades urbanas y escapadas tranquilas evitando la búsqueda manual.
* **Fuentes de alimentación:** Agenda cultural ICAS (Sevilla), iCal del Ayuntamiento de Sevilla, Agenda Cultural de Andalucía y Turismo de la Provincia. Excluido eventos deportivos.
* **Tiempo de desplazamiento configurable (NUEVO):** 
  * La app no limita rígidamente los planes a 45 minutos.
  * Incluye un selector de radio de desplazamiento (*30 min*, *45 min*, *60 min* o *Sin límite / Escapada*).
  * El usuario puede cambiar este parámetro en cualquier momento y la app filtrará dinámicamente los planes de la caché o del feed.
* **Mantenimiento del feed:** Máximo 3 tarjetas principales y hasta 2 de reserva por semana.

### 3.2 Módulo 2: Hogar y Mantenimiento
* **Propósito:** Sugerir revisiones domésticas periódicas y estacionales sin agobio mental.
* **Pool Inicial de Tareas Recomendadas (NUEVO):**
  * La app viene preequipada con una biblioteca/catálogo inicial de mantenimientos recomendados organizados por frecuencia y época del año:
    * *Primavera/Otoño:* Revisión y limpieza de filtros de aire acondicionado y climatización.
    * *Trimestral:* Revisión de botiquín, caducidades e inventario básico.
    * *Semestral:* Limpieza profunda de electrodomésticos y revisión de aislamientos/ventanas.
    * *Anual:* Purga de radiadores, revisión de garantías/contratos de suministros.
  * **Activación por un toque:** El usuario activa o desactiva elementos de este pool inicial mediante un selector simple durante el primer uso o desde la configuración.

### 3.3 Módulo 3: Compras No Impulsivas
* **Propósito:** Analizar necesidades reales de compra, estudiar opciones y evitar decisiones impulsivas.
* **Captura de Necesidad con Inteligencia:**
  * El usuario introduce un deseo o necesidad breve en la app (ej. *"Necesito unos auriculares inalámbricos con buena cancelación de ruido para trabajar"*).
  * La app consulta la API gratuita de Gemini, la cual devuelve 2 o 3 modelos concretos recomendados, precio orientativo actual y una justificación de valor.
* **Modo "Observación" (30 Días):** La compra entra por defecto en estado de enfriamiento/observación. Incluye botones: *"Comparar"*, *"Posponer 30 días"*, *"Descartar"*, *"Comprado"*.
* **Rastreo de Chollos/Precios sin Bloqueo:** Para evitar bloqueos anti-scraping de tiendas online, el usuario puede configurar alertas externas (Keepa, Chollometro, CamelCamelCamel) dirigidas a una etiqueta de Gmail (`Alertas_Compras`). Apps Script lee esos correos, Gemini extrae la bajada de precio y actualiza la tarjeta si coincide con una necesidad en observación.

### 3.4 Módulo 4: Decisiones Personales Aplazadas
* **Propósito:** Sacar de la cabeza asuntos no urgentes pero pendientes de resolver (ej. cambio de tarifa energética, renovación de suscripción, reorganización de un espacio).
* **Campos:** Asunto, motivo del aplazamiento, criterio de decisión, próxima fecha de revisión.
* **Acciones Rápidas:** *"Decidir ahora"*, *"Posponer 1 mes"*, *"Descartar"*.
* **Almacenamiento:** 100 % local en el dispositivo.

---

## 4. Estrategia de UX/UI y Pruebas Visuales en Google Antigravity

Para cumplir con el requerimiento de una **factura visual premium y amigable**, no se fijará un diseño estático por código de antemano. Se utilizará la capacidad de creación interactiva de Google Antigravity para probar y seleccionar la capa estética.

### 4.1 Proceso de Selección Estética Iterativa
Dentro del entorno de Antigravity, el agente construirá una vista especial de **"Galería de Estilos Visuales"** en la primera fase de desarrollo:

1. **Opción A (Cálido Editorial):** Fondo marfil (`#FDFBF7`), detalles terracota (`#E07A5F`), verde salvia (`#81B29A`), tipografía serif suave para títulos y sans-serif para cuerpo.
2. **Opción B (Minimalista Nordico):** Fondo gris cálido muy claro (`#F4F4F6`), acentos en azul noche (`#1D2A44`), bordes ultra suaves sin sombras y gran espacio blanco.
3. **Opción C (Pastel Suave / Muted):** Fondo beige rosado (`#FAF6F0`), acentos en arcilla y musgo, bordes redondeados pronunciados (`rounded-3xl`).

**Flujo:** El Director de Proyecto probará las tres variantes directamente en la ventana de previsualización de Antigravity, seleccionará la que le transmita la sensación más amigable y relajante, y el agente fijará esa línea de diseño para todos los componentes.

### 4.2 Estructura de Navegación de la App
* **Barra inferior fija (5 pestañas):**
  * `Hoy`: Portada condensada con un mensaje de estado ("Nada urgente hoy") y un máximo de 4 tarjetas destacadas (1 por módulo).
  * `Planes`: Vista filtrable por tiempo de desplazamiento con selector dinámico.
  * `Casa`: Vista del pool de tareas activas y acceso a la biblioteca inicial.
  * `Compras`: Tarjetas en observación y buscador asistido de modelos.
  * `Decisiones`: Asuntos aplazados ordenados por próxima fecha de revisión.

---

## 5. Contrato de Datos

### 5.1 Feed Remoto (`FeedV2` - Google Sheets / Apps Script)
```typescript
interface FeedV2 {
  schemaVersion: 2;
  generatedAt: string;
  validUntil: string;
  status: "ok" | "partial";
  planes: PlanCard[];
  hogarSugerencias: HogarSugerencia[];
}

interface PlanCard {
  id: string;
  title: string;
  summary: string;
  startsAt: string;
  endsAt?: string;
  venue: string;
  municipality: string;
  travelMinutes: number; // Evaluado contra el filtro dinámico de la app
  priceText?: string;
  categories: string[];
  whyMatch: string;
  sourceUrl: string;
  expiresAt: string;
}

interface HogarSugerencia {
  id: string;
  title: string;
  season: "primavera" | "verano" | "otono" | "invierno" | "anual";
  recommendedFrequencyMonths: number;
  description: string;
}
```

### 5.2 Almacenamiento Local (`Dexie.js / IndexedDB`)
```typescript
// Tablas locales dentro del móvil del usuario
interface UserPreferences {
  key: string; // "maxTravelMinutes", "selectedTheme", etc.
  value: any;
}

interface LocalPurchase {
  id: string;
  desireTitle: string;
  suggestedModels: { name: string; estimatedPrice: string; sourceLink?: string }[];
  targetPrice?: number;
  status: "watching" | "comparing" | "deferred" | "bought" | "discarded";
  reviewDate: string;
  createdAt: string;
}

interface LocalDecision {
  id: string;
  title: string;
  reasonForDefer: string;
  decisionCriteria: string;
  reviewDate: string;
  status: "pending" | "decided" | "deferred" | "discarded";
}

interface LocalTaskState {
  taskId: string;
  lastDoneAt?: string;
  nextDueDate: string;
  isCustom: boolean;
  active: boolean;
}
```

---

## 6. Guía de Ejecución Paso a Paso (Para Director de Proyecto)

Esta guía describe las acciones exactas que debe realizar el usuario, sin requerir experiencia previa en programación.

---

### FASE 0: Obtención de Claves Gratuitas (10 Minutos)

1. **Obtener API Key de Gemini:**
   * Entra en [Google AI Studio](https://aistudio.google.com/).
   * Inicia sesión con tu cuenta personal de Gmail.
   * Haz clic en el botón **"Get API Key"** y luego en **"Create API Key"**.
   * Copia la cadena de texto resultante y guárdala en un bloc de notas.

2. **Descargar e Instalar Google Antigravity:**
   * Descarga la aplicación de escritorio de [antigravity.google](https://antigravity.google).
   * Ejecuta el instalador en Windows e inicia sesión con tu cuenta de Google.

---

### FASE 1: Construcción del Backend en Google Apps Script (15 Minutos)

1. Entra en [script.google.com](https://script.google.com) y pulsa en **"Nuevo Proyecto"**.
2. Asigna el nombre **"Asistente_Personal_Backend"** al proyecto.
3. Borra el código por defecto del editor.
4. Pega el siguiente código maestro (reemplazando `TU_API_KEY_AQUÍ` por la clave copiada en la Fase 0):

```javascript
const GEMINI_API_KEY = "TU_API_KEY_AQUÍ";

function ejecutarActualizacionSemanal() {
  const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.create("Asistente_Personal_DB");
  
  // 1. Obtener eventos de fuentes y generar prompt para Gemini
  const prompt = `Actúa como un curador de ocio y mantenimiento personal para Sevilla y alrededores.
  Devuelve un JSON estrictamente válido con dos listas:
  1. "planes": 3 planes culturales/ocio no deportivos con título, resumen, lugar, municipio, travelMinutes (estimación en minutos desde Sevilla), precio aproximado, categorías y URL de origen.
  2. "hogarSugerencias": 2 sugerencias de mantenimiento estacional según el mes actual.
  Formato de respuesta: JSON puro sin bloques markdown de código.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const payload = {
    "contents": [{"parts": [{"text": prompt}]}]
  };
  
  const options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload)
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const jsonText = JSON.parse(response.getContentText()).candidates[0].content.parts[0].text;
    
    // Clean potential markdown quotes
    const cleanJson = jsonText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let sheet = ss.getSheetByName("published_feed");
    if (!sheet) {
      sheet = ss.insertSheet("published_feed");
    }
    sheet.clear();
    sheet.getRange("A1").setValue(cleanJson);
    
    Logger.log("Feed actualizado correctamente.");
  } catch (e) {
    Logger.log("Error al actualizar: " + e.toString());
  }
}

// Configurar como Ejecución Web
function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("published_feed");
  const data = sheet ? sheet.getRange("A1").getValue() : "{}";
  
  return ContentService.createTextOutput(data).setMimeType(ContentService.MimeType.JSON);
}
```

5. Haz clic en **Guardar** (icono de disquete) y pulsa **Ejecutar** en la función `ejecutarActualizacionSemanal` para validar que crea la hoja de cálculo de forma automática.
6. Haz clic en **Desplegar** -> **Nuevo despliegue** -> Tipo **"Aplicación web"**.
   * *Acceso:* "Cualquier persona".
   * Copia la **URL de la Aplicación Web** generada. Esta será la dirección de tu feed para la app.

---

### FASE 2: Desarrollo Frontend e Interfaz en Google Antigravity

1. Abre la aplicación **Google Antigravity** en tu ordenador.
2. Haz clic en **"New Agent Project"**, selecciona la plantilla **React + Vite** y nombra el proyecto como `asistente-personal-app`.
3. Una vez abierto el espacio de trabajo, abre el **panel de chat del Agente de IA** en Antigravity.

#### Prompt 1 (Configuración de Base y Selección de Tema Visual):
Copiar y pegar en el chat de Antigravity:

> "Actúa como desarrollador Frontend Senior y diseñador UX. Vamos a construir una App React para Android usando Tailwind CSS y Lucide Icons.
> 
> Paso 1: Instala Tailwind CSS y lucide-react.
> Paso 2: Crea un componente selector de temas visuales en la parte superior con 3 variantes: 'Cálido Editorial' (marfil/terracota/salvia), 'Minimalista Nórdico' (gris claro/azul noche) y 'Pastel Suave' (beige/arcilla).
> Paso 3: Crea la barra de navegación inferior fija con 5 pestañas: Hoy, Planes, Casa, Compras, Decisiones.
> Paso 4: En la pestaña 'Planes', añade un selector de tiempo de desplazamiento (30 min, 45 min, 60 min, Sin límite).
> Paso 5: En la pestaña 'Casa', añade un panel con un 'Pool Inicial de Tareas Recomendadas' preequipado con 6 mantenimientos estacionales que el usuario pueda activar/desactivar con un interruptor."

#### Prompt 2 (Módulo de Compras e Integración Dexie.js):
Copiar y pegar en el chat de Antigravity tras ver la primera previsualización:

> "Ahora vamos a añadir la persistencia de datos local y la inteligencia de compras.
> 
> Paso 1: Instala Dexie.js y crea la base de datos local IndexedDB para guardar las decisiones, las compras en observación y el estado de las tareas del hogar.
> Paso 2: En el módulo 'Compras', crea una interfaz donde el usuario pueda escribir un deseo (ej. 'Auriculares inalámbricos'). Al pulsar 'Buscar Opciones', simula o conecta una llamada a la API gratuita de Gemini para mostrar 2 modelos concretos recomendados con su rango de precio y guardarlos en una tarjeta en estado 'Observación 30 días'.
> Paso 3: Asegúrate de que las tarjetas tengan botones de acción rápida con bordes muy redondeados y sombras elegantes."

---

### FASE 3: Pruebas y Compilación del APK para Móvil

1. Prueba la aplicación en la pantalla de previsualización de Antigravity. Cambia los estilos visuales, prueba el selector de minutos en Planes y activa tareas del pool de Hogar.
2. Cuando el diseño sea de tu agrado, dale la orden final al agente de Antigravity:

> "Añade Capacitor Android a este proyecto con el identificador `es.personal.asistenteproactivo` y el nombre 'Asistente Personal'. Prepara la configuración de producción y ejecuta los comandos para compilar el proyecto y generar el archivo APK firmado (Release)."

3. El agente de Antigravity ejecutará el proceso de compilación en la terminal integrada y te mostrará la ruta exacta del archivo `.apk` dentro de tu ordenador.
4. Copia ese archivo `.apk` a tu móvil (vía cable USB, Google Drive o Telegram) e instálalo aceptando los permisos de orígenes desconocidos.

---

## 7. Criterios de Éxito y Evaluación del Piloto

El proyecto se considerará completado con éxito tras un **piloto de 2 semanas** si cumple los siguientes indicadores:

1. **Cero Mantenimiento Manual:** El alimentador de Apps Script se actualiza solo los miércoles sin arrojar errores.
2. **Revisión en Menos de 2 Minutos:** Abrir la app los miércoles requiere menos de dos minutos para revisar los planes y decidir las acciones.
3. **Utilidad Real:** Al menos 1 plan recomendado a la semana resulta verdaderamente atrayente para el usuario.
4. **Cero Gastos:** El coste total registrado durante el desarrollo y uso se mantiene en **0,00 €**.
5. **Calidad de Datos:** Fechas, municipios y enlaces son correctos en al menos el 90 % de las tarjetas generadas.