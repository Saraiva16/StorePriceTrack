import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

// Configuração SSL segura e confiável via mkcert
const certPath = path.resolve(__dirname, 'localhost+3.pem')
const keyPath = path.resolve(__dirname, 'localhost+3-key.pem')
const hasCustomCerts = fs.existsSync(certPath) && fs.existsSync(keyPath)

export default defineConfig({
  plugins: [react(), versionPlugin()],
  define: {
    __APP_BUILD_TIME__: JSON.stringify(buildTimestamp)
  },
  server: {
    https: hasCustomCerts
      ? {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath)
        }
      : true,
    host: true,
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        secure: false
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js'
  }
})
