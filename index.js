/**
 * dsh-plugin-lgd-trust — host half.
 *
 * Reads a local evaluation snapshot and serves a read-only summary.
 * Security posture: no network, no writes, no spawning, GET/HEAD only,
 * path fixed to an allow-listed file (override only via env, documented).
 *
 * Route: GET /api/lgd-trust/summary
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export const name = 'lgd-trust';
export const inject = ['webServer'];

const ROUTE = '/api/lgd-trust/summary';

const DEFAULT_CANDIDATES = [
  path.join(os.homedir(), '.dsh', 'lgd-trust', 'skills187-eval.json'),
  'D:/deepseek-harness/default-workspace/work/eval-run/skills187-eval.json',
];

function snapshotPath() {
  const override = process.env.LGD_TRUST_SNAPSHOT;
  if (override) return path.resolve(override.replace(/^~/, os.homedir()));
  return DEFAULT_CANDIDATES.find((p) => fs.existsSync(p)) || DEFAULT_CANDIDATES[0];
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

export function summarize(file = snapshotPath()) {
  const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(rows)) throw new Error('snapshot must be an array');
  const evaluated = rows.filter((r) => r && r.state === 'evaluated' && typeof r.score === 'number');
  const nv = rows.filter((r) => !r || r.state !== 'evaluated');
  const grades = {};
  for (const r of evaluated) grades[r.grade] = (grades[r.grade] || 0) + 1;
  const sorted = [...evaluated].sort((a, b) => a.score - b.score);
  return {
    generatedAt: new Date().toISOString(),
    snapshotFile: file,
    policy: 'E2 = author-reproducible; NV is never a pass; read-only, no network',
    coverage: { total: rows.length, evaluated: evaluated.length, nv: nv.length },
    grades,
    lowest: sorted.slice(0, 5).map((r) => ({ slug: r.slug, score: r.score, grade: r.grade, critical: r.critical || 0 })),
    highest: sorted.slice(-5).reverse().map((r) => ({ slug: r.slug, score: r.score, grade: r.grade })),
  };
}

export function apply(ctx) {
  ctx.effect(() =>
    ctx.webServer.register({
      kind: 'exact',
      path: ROUTE,
      handler(req, res) {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          sendJson(res, 405, { error: 'method not allowed' });
          return;
        }
        try {
          sendJson(res, 200, summarize());
        } catch (error) {
          sendJson(res, 503, {
            error: 'evaluation snapshot unavailable',
            hint: 'set LGD_TRUST_SNAPSHOT to a skills187-eval.json file, or run the exporter',
            detail: String((error && error.message) || error),
          });
        }
      },
    }),
  );
}
