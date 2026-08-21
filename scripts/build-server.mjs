/**
 * Bundles the API server with esbuild.
 *
 * The output is a single ESM file that only needs Node plus the native/runtime
 * packages listed in `external`, which keeps the deployed image small and the
 * start command trivial (`node dist-server/index.js`).
 */
import { build } from 'esbuild';
import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const outdir = path.join(root, 'dist-server');

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });

await build({
  entryPoints: {
    index: path.join(root, 'server/src/index.ts'),
    seed: path.join(root, 'server/src/seed.ts'),
  },
  outdir,
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  sourcemap: true,
  minify: false,
  logLevel: 'info',
  // `pg` loads optional native helpers at runtime; keeping these external
  // (rather than bundling) avoids esbuild resolving optional dependencies.
  external: ['pg', 'pg-native', 'express', 'multer', 'helmet', 'compression', 'cookie-parser'],
  banner: {
    // Some transitive CJS dependencies expect `require` to exist in ESM scope.
    js: [
      "import { createRequire as __createRequire } from 'node:module';",
      'const require = __createRequire(import.meta.url);',
    ].join('\n'),
  },
});

// schema.sql is read from disk at boot, so it ships next to the bundle.
await cp(path.join(root, 'server/src/schema.sql'), path.join(outdir, 'schema.sql'));

console.log('[noafar] سرور در dist-server/ ساخته شد.');
