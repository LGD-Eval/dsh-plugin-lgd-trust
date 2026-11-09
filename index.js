/**
 * dsh-plugin-lgd-trust — host half.
 *
 * Read-only summary of a local evaluation snapshot.
 * Security posture (declaration, NOT an enforced sandbox): no network, no writes,
 * no child processes; GET/HEAD only; reads one JSON file from a whitelist of paths.
 *
 * Route: GET /api/lgd-trust/summary
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const name = 'lgd-trust';
export const inject = ['webServer'];

const ROUTE = '/api/lgd-trust/summary';
const SCHEMA = 'lgd-trust.snapshot/v1';
const COUNTING_RULES = 'count-v1 (evaluated = state==="evaluated" && number score; NV = everything else; lowest sorted by score asc; NV never ranked)';
const STALE_DAYS = 14;

const HOME = os.homedir();
export const WHITELIST = [
  path.join(HOME, '.dsh', 'lgd-trust', 'skills187-eval.json'),
  'D:/deepseek-harness/default-workspace/work/eval-run/skills187-eval.json',
];

export function resolvedPath(override = process.env.LGD_TRUST_SNAPSHOT) {
  if (override) {
    const expanded = override.replace(/^~/, HOME);
    if (!path.isAbsolute(expanded)) {
      const err = new Error('LGD_TRUST_SNAPSHOT must be an absolute path');
      err.code = 'SNAPSHOT_BAD_PATH';
      throw err;
    }
    return path.resolve(expanded);
  }
  return WHITELIST.find((p) => fs.existsSync(p)) || WHITELIST[0];
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

export function summarize(file = resolvedPath()) {
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch (e) {
    const err = new Error('snapshot not found');
    err.code = 'SNAPSHOT_NOT_FOUND';
    err.searchedPaths = process.env.LGD_TRUST_SNAPSHOT ? [file] : WHITELIST;
    throw err;
  }
  let rows;
  try {
    rows = JSON.parse(raw);
  } catch {
    const err = new Error('snapshot is not valid JSON');
    err.code = 'SNAPSHOT_INVALID_JSON';
    throw err;
  }
  if (!Array.isArray(rows)) {
    const err = new Error('snapshot must be an array');
    err.code = 'SNAPSHOT_BAD_SCHEMA';
    throw err;
  }
  const evaluated = rows.filter((r) => r && r.state === 'evaluated' && typeof r.score === 'number');
  const nv = rows.filter((r) => !r || r.state !== 'evaluated');
  const grades = {};
  for (const r of evaluated) grades[r.grade] = (grades[r.grade] || 0) + 1;
  const sorted = [...evaluated].sort((a, b) => a.score - b.score);

  let generatedAt = null;
  let ageDays = null;
  try {
    const st = fs.statSync(file);
    generatedAt = st.mtime.toISOString();
    ageDays = Math.floor((Date.now() - st.mtimeMs) / 86400000);
  } catch {}
  const sha256 = crypto.createHash('sha256').update(raw).digest('hex');

  return {
    generatedAt,
    ageDays,
    stale: ageDays === null ? null : ageDays > STALE_DAYS,
    snapshotFile: file,
    sha256,
    schema: SCHEMA,
    countingRules: COUNTING_RULES,
    policy: 'Evidence strength (E0–E4) and score grades (A+/A/…) are different scales; NV = Not Verified and is never a pass.',
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
          const code = (error && error.code) || 'SNAPSHOT_UNAVAILABLE';
          sendJson(res, 422, {
            error: code,
            message: String((error && error.message) || error),
            searchedPaths: (error && error.searchedPaths) || [resolvedPath()],
            expectedSchema: SCHEMA,
            hint: 'put a snapshot at one of searchedPaths, or set LGD_TRUST_SNAPSHOT to a file you trust',
          });
        }
      },
    }),
  );
}
