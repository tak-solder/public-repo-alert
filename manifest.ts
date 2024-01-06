import { defineManifest } from '@crxjs/vite-plugin'
// @ts-ignore
import packageJson from './package.json'
const { version } = packageJson

// Convert from Semver (example: 0.1.0-beta6)
const [major, minor, patch, label = '0'] = version
  // can only contain digits, dots, or dash
  .replace(/[^\d.-]+/g, '')
  // split into version parts
  .split(/[.-]/)

export default defineManifest(async () => ({
  manifest_version: 3,
  name: 'GitHub Public Repo Alert',
  // up to four numbers separated by dots
  version: `${major}.${minor}.${patch}.${label}`,
  // semver is OK in "version_name"
  version_name: version,
  icons: {
    32: 'icons/32.png',
    48: 'icons/48.png',
    128: 'icons/128.png',
  },
  content_scripts: [
    {
      matches: ["https://github.com/*"],
      js: ["src/content-script/main.tsx"]
    },
  ],
  options_ui: {
    page: "src/options/index.html",
    open_in_tab: true,
  },
  permissions: [
    "storage",
  ],
}))
