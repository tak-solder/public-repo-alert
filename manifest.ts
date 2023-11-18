import { defineManifest } from '@crxjs/vite-plugin'
// @ts-ignore
import packageJson from './package.json'
import {ConfigEnv} from "vite";
const { version } = packageJson

// Convert from Semver (example: 0.1.0-beta6)
const [major, minor, patch, label = '0'] = version
  // can only contain digits, dots, or dash
  .replace(/[^\d.-]+/g, '')
  // split into version parts
  .split(/[.-]/)

export default defineManifest(async (env: ConfigEnv) => ({
  manifest_version: 3,
  name:
    env.mode === 'staging'
      ? '[INTERNAL] Public Repo Alert'
      : 'Public Repo Alert',
  // up to four numbers separated by dots
  version: `${major}.${minor}.${patch}.${label}`,
  // semver is OK in "version_name"
  version_name: version,
  action: { default_popup: 'index.html' },
  content_scripts: [
    {
      matches: ["https://github.com/*"],
      js: ["src/content-script/main.tsx"]
    },
  ],
}))
