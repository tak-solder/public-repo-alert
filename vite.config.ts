import {ConfigEnv, defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import {crx, defineManifest} from '@crxjs/vite-plugin'
// @ts-ignore
import manifest from './manifest'

export default defineConfig(async (env: ConfigEnv) => ({
  plugins: [
    react(),
    crx({ manifest }),
  ],
}))
