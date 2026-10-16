# Salah Surahs

Paired surahs for the two rakahs, in large high-contrast transliteration to read during prayer; the screen stays awake.

**Live:** https://salah-surahs.muamer-arifi.workers.dev

- The app is in `public/` (one `index.html`, `manifest.json`, `sw.js` for offline use, and the icons).
- Cloudflare Workers Builds deploys every push to `main` (`npx wrangler deploy`, see `wrangler.jsonc`).
- Moved from Netlify (https://illustrious-bunny-e28684.netlify.app), copied file for file.
