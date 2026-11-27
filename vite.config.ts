import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function collectRelativeFiles(dir: string, baseDir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectRelativeFiles(full, baseDir));
    } else {
      const rel = path.relative(baseDir, full).replace(/\\/g, '/');
      if (rel !== 'sw.js') {
        results.push(`./${rel}`);
      }
    }
  }
  return results;
}

function injectSwPrecacheManifest(): Plugin {
  return {
    name: 'inject-sw-precache-manifest',
    apply: 'build',
    writeBundle(options) {
      const outDir = options.dir ? path.resolve(options.dir) : path.resolve('dist');
      const swPath = path.join(outDir, 'sw.js');
      if (!fs.existsSync(swPath)) return;

      const files = ['./', ...collectRelativeFiles(outDir, outDir)];
      const uniqueFiles = Array.from(new Set(files)).sort();
      const hash = crypto
        .createHash('sha256')
        .update(uniqueFiles.join('|'))
        .digest('hex')
        .slice(0, 10);

      let swContent = fs.readFileSync(swPath, 'utf8');
      swContent = swContent
        .replace("'__SW_CACHE_NAME__'", `'sanzo-wada-${hash}'`)
        .replace("['__SW_PRECACHE_URLS__']", JSON.stringify(uniqueFiles));

      fs.writeFileSync(swPath, swContent, 'utf8');
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), injectSwPrecacheManifest()],
  // Crucial for GitHub Pages: relative asset paths so it works at any subpath e.g. username.github.io/colors/
  base: './',
});
