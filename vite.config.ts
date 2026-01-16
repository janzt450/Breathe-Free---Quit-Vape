import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: This ensures assets are loaded relatively, 
  // preventing white screens in the Electron production build.
  base: './', 
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});