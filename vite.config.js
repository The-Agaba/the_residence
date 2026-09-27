import { defineConfig } from 'vite';

export default defineConfig({
  base: '/the_residence/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // Suppress large chunk warning — Three.js is inherently large
        manualChunks: undefined,
      },
    },
    chunkSizeWarningLimit: 700,
  },
});
