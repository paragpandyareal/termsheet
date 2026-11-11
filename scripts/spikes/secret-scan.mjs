// Checks that no value from .env appears anywhere in git history. Prints only setting names, never values.
//   node --env-file=.env scripts/spikes/secret-scan.mjs
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const names = fs.readFileSync('.env.example', 'utf8').split('\n').map((l) => l.split('=')[0].trim()).filter((n) => /^[A-Z_]+$/.test(n));
const history = execFileSync('git', ['log', '--all', '-p', '--format=%H %an %ae %s%n%b'], { maxBuffer: 1 << 30 }).toString();
let leaks = 0;
for (const n of names) {
  const v = process.env[n];
  if (!v || v.length < 12 || /^https?:\/\/(api-m\.sandbox\.paypal\.com|localhost)/.test(v) || /^(live|mock|claude-)/.test(v)) continue;
  if (history.includes(v)) { console.log(`FOUND in history: ${n}`); leaks++; }
}
console.log(leaks ? `${leaks} secret value(s) found in history` : `Checked ${names.length} settings: no .env values found in git history`);
