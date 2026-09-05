import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // './' vale para GitHub Pages (subruta) y para el APK (file://).
  base: './',
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
  }
});
