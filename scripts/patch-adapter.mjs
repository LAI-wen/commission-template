/**
 * Patches @sveltejs/adapter-cloudflare to avoid loading wrangler (and thus the
 * workerd binary) during Cloudflare Pages builds.
 *
 * Root cause: wrangler's cli.js does `require('workerd')` on load. workerd
 * checks for its platform binary at module-evaluation time. On CF Pages' Linux
 * build environment the @cloudflare/workerd-linux-64 optional dep is not
 * installed (likely omitted or timed out), so the binary check throws.
 *
 * Fix for 7.x adapter (uses getPlatformProxy + unstable_readConfig):
 *   - Replace the static `import { ... } from 'wrangler'` with a conditional
 *     top-level await that skips loading when CF_PAGES=1.
 *   - Add an early-return to validate_wrangler_config() for CF_PAGES builds.
 *
 * Fix for 4.x adapter (uses only getPlatformProxy):
 *   - Replace the static import with a comment.
 *   - Add a dynamic import inside emulate().
 *
 * Result: on CF Pages only `adapt()` runs (never `emulate()`), and with no
 * wrangler.toml we don't need unstable_readConfig either. Locally everything
 * works as before.
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';

let adapterPath;
try {
  const resolved = import.meta.resolve('@sveltejs/adapter-cloudflare');
  adapterPath = fileURLToPath(resolved);
} catch {
  console.log('patch-adapter: @sveltejs/adapter-cloudflare not found, skipping.');
  process.exit(0);
}

let src = readFileSync(adapterPath, 'utf-8');

// Already patched?
if (!src.includes("from 'wrangler'")) {
  console.log('patch-adapter: already patched or not needed.');
  process.exit(0);
}

// ── 7.x: imports both getPlatformProxy AND unstable_readConfig ──────────────
if (src.includes("import { getPlatformProxy, unstable_readConfig } from 'wrangler'")) {
  // 1. Replace static import with conditional top-level await
  src = src.replace(
    "import { getPlatformProxy, unstable_readConfig } from 'wrangler';",
    `// patched: lazy wrangler import to avoid workerd binary check on CF Pages (scripts/patch-adapter.mjs)
let getPlatformProxy, unstable_readConfig;
if (!process.env.CF_PAGES) {
\t({ getPlatformProxy, unstable_readConfig } = await import('wrangler'));
}`
  );

  // 2. Short-circuit validate_wrangler_config for CF_PAGES builds
  src = src.replace(
    'function validate_wrangler_config(config_file = undefined) {\n\tconst wrangler_config = unstable_readConfig',
    'function validate_wrangler_config(config_file = undefined) {\n\tif (process.env.CF_PAGES) return { wrangler_config: {}, building_for_cloudflare_pages: true };\n\tconst wrangler_config = unstable_readConfig'
  );

  writeFileSync(adapterPath, src, 'utf-8');
  console.log('patch-adapter: patched adapter-cloudflare 7.x — conditional wrangler import + CF_PAGES short-circuit.');

// ── 4.x: imports only getPlatformProxy ──────────────────────────────────────
} else if (src.includes("import { getPlatformProxy } from 'wrangler'")) {
  src = src.replace(
    "import { getPlatformProxy } from 'wrangler';",
    '// patched: lazy wrangler import (scripts/patch-adapter.mjs)\nlet getPlatformProxy;'
  );

  src = src.replace(
    'const proxy = await getPlatformProxy(options.platformProxy);',
    "if (!getPlatformProxy) ({ getPlatformProxy } = await import('wrangler'));\n\t\t\t\tconst proxy = await getPlatformProxy(options.platformProxy);"
  );

  writeFileSync(adapterPath, src, 'utf-8');
  console.log('patch-adapter: patched adapter-cloudflare 4.x — lazy wrangler import in emulate().');

} else {
  console.log('patch-adapter: unrecognised adapter version — skipping.');
}
