import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const buildTimestamp = Date.now();

const versionPlugin = () => ({
  name: 'generate-version-file',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'version.json',
      source: JSON.stringify(
        {
          version: buildTimestamp,
          builtAt: new Date(buildTimestamp).toISOString()
        },
        null,
        2
      )
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), versionPlugin()],
  define: {
    __APP_BUILD_TIME__: JSON.stringify(buildTimestamp)
  },
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js'
  }
})
