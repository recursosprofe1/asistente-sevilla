# Regla: trabajar sin terminal

El usuario prefiere no escribir comandos en el terminal. Actua en consecuencia:

1. Ejecuta tu mismo los comandos necesarios (npm, npx cap, git) con tus herramientas, no le pidas al usuario que abra un terminal.
2. Stack del proyecto: Vite 5 + React 18 + Tailwind 3 + Capacitor 8. `webDir` es `dist/`. Puerto dev: 3000.
3. Flujos preferidos:
   - Dev: `npm install` si falta `node_modules`, luego `npm run dev` y reporta la URL `http://localhost:3000`.
   - Build web: `npm run build`.
   - Android: siempre `npm run build` antes de `npx cap sync`. No hacer `npx cap open` sin preguntar.
   - Preview: `npm run preview` (puerto 4173).
4. Si un comando falla, muestra el error resumido en lenguaje simple y propone el siguiente paso con boton/accion, nunca solo el comando pelado.
5. Para Git, usa tus herramientas y resume el resultado. No pidas `git status`, `git diff`, `git log` manuales.
6. Para adjuntar capturas/APK (`Asistente_Sevilla_v1.apk`, `dist/`, `android/`), localiza tu mismo los archivos y explica donde estan en el Explorer.
