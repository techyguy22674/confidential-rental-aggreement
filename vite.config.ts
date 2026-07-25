import { defineConfig } from 'vite';
import { resolve } from 'path';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait()
  ],
  build: {
    outDir: 'dist',
    target: 'esnext',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        checkin: resolve(__dirname, 'checkin.html'),
        admin: resolve(__dirname, 'admin.html'),
        inspector: resolve(__dirname, 'inspector.html'),
        explorer: resolve(__dirname, 'explorer.html'),
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext'
    }
  },
  server: {
    port: 5177,
    hmr: {
      overlay: false
    }
  }
});
