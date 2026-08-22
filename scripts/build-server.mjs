/**
 * Bundles the API server with esbuild.
 *
 * The output is a single ESM file that only needs Node plus the native/runtime
 * packages listed in `external`, which keeps the deployed image small and the
 * start command trivial (`node dist-server/index.js`).
 */
import { build } from 'esbuild';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const outdir = path.join(root, 'dist-server');

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });

await build({
  entryPoints: {
    index: path.join(root, 'server/src/index.ts'),
    // Exported separately so a serverless entry point can import the app
    // without the listening server's side effects.
    app: path.join(root, 'server/src/app.ts'),
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

console.log('[noafar] سرور در dist-server/ ساخته شد.');
