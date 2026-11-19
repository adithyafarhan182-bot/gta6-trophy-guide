// Leonida Legend — the hand-in program for gta6-trophy-guide-01 (Node 22, stdlib only).
//
// The guide itself is plain static files in app/ (index.html, style.css, app.js,
// guide.js, roadmap.js, data/trophies.json) and its screenshots live in screenshots/.
// This program copies both into the grader's output directory and writes
// dossier.json with the kit's buildDossier, exactly as the scorer rebuilds it.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// vendor/makefun-frontend.ts is the kit's copy and is left untouched: the scorer
// requires dossier.json to be byte for byte what its own copy of the library writes.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function fail(message) {
  throw new Error(`leonida-legend: ${message}`);
}

function checkShots(dir) {
  // The gate allows 3 or 4 screenshots, each a whole PNG or JPEG under 256 KiB.
  // Refuse early, with words, instead of handing in an entry the gate refuses.
  if (!existsSync(dir)) fail('screenshots/ is missing');
  const shots = readdirSync(dir).filter((name) => !name.startsWith('.'));
  if (shots.length < 3 || shots.length > 4) {
    fail(`expected 3 or 4 screenshots, found ${shots.length}`);
  }
  for (const name of shots) {
    const size = statSync(join(dir, name)).size;
    if (size > 262144) fail(`screenshot ${name} is ${size} bytes (over 256 KiB)`);
    if (!/\.(png|jpe?g)$/i.test(name)) fail(`screenshot ${name} is not a PNG or JPEG`);
  }
  return shots;
}

mkdirSync(outDir, { recursive: true });
if (!existsSync(join(repoRoot, 'app', 'index.html'))) {
  fail('app/index.html is missing');
}
cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
const shots = checkShots(join(repoRoot, 'screenshots'));
cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);

console.log(`leonida-legend: handed in ${shots.length} screenshots to ${outDir}`);
