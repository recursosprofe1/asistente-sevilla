---
name: dev-sin-terminal
description: Arranca, compila o sincroniza el proyecto Vite + Capacitor sin que el usuario toque el terminal
---

# Dev sin terminal

Usa este skill cuando el usuario diga "arranca", "compila", "sincroniza", "no quiero usar el terminal", o pida dev/build/preview/Android.

## Instrucciones

1. Detecta que necesita:
   - "arranca / dev" -> verifica `node_modules`, si falta ejecuta `npm install`, luego `npm run dev` en background. Responde con URL `http://localhost:3000`.
   - "build" -> ejecuta `npm run build` y verifica que existe `dist/index.html`.
   - "preview" -> ejecuta `npm run build` si `dist/` esta desactualizado, luego `npm run preview`.
   - "android / apk / capacitor" -> ejecuta `npm run build`, luego `npx cap sync`. Resume si `android/` se actualizo. No abras Android Studio sin permiso.
2. Nunca le pidas al usuario que copie/pegue comandos. Ejecutalos tu.
3. Si hay error de dependencias (pnpm vs npm: el proyecto tiene `pnpm-workspace.yaml` y `package-lock.json`), avisa y usa npm por defecto salvo que el usuario prefiera pnpm.
4. Al terminar, indica la accion GUI equivalente: `Ctrl+Shift+P > Tasks: Run Task > npm: dev / cap: sync`, o `Run > Start Debugging`.
