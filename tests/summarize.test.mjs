import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { summarize } from '../index.js';

function tmpSnapshot(rows) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lgd-trust-test-'));
  const file = path.join(dir, 'snapshot.json');
  fs.writeFileSync(file, JSON.stringify(rows));
  return file;
}

test('summarize returns coverage, grades, and lowest entries', () => {
  const file = tmpSnapshot([
    { slug: 'a', score: 100, grade: 'A+', state: 'evaluated' },
    { slug: 'b', score: 82, grade: 'A', state: 'evaluated' },
    { slug: 'c', state: 'NV' },
  ]);
  const s = summarize(file);
  assert.equal(s.coverage.total, 3);
  assert.equal(s.coverage.evaluated, 2);
  assert.equal(s.coverage.nv, 1);
  assert.deepEqual(s.grades, { 'A+': 1, A: 1 });
  assert.equal(s.lowest[0].slug, 'b');
  assert.match(s.policy, /never a pass/);
});

test('invalid snapshot throws (host turns this into HTTP 503)', () => {
  const file = tmpSnapshot({ not: 'an array' });
  assert.throws(() => summarize(file), /must be an array/);
});

test('missing file throws', () => {
  assert.throws(() => summarize(path.join(os.tmpdir(), 'does-not-exist-xyz.json')));
});
