# Changelog

## 0.2.1 — 2026-11-09

- LGD_TRUST_SNAPSHOT must be an absolute path; relative paths are rejected with
  SNAPSHOT_BAD_PATH (external AI review finding).
- README: removed NV ambiguity (NV = Not Verified only; npm status written as “not published”).

## 0.2.0 — 2026-11-09

Response to an independent zero-context review (8 findings, 3 P0):

- **Install**: concrete clone + `dsh plugin add` commands, profile snippet, uninstall, minimum
  DSH version marked NV; npm/git+tag marked NV.
- **Security**: explicitly a code declaration, not an enforced sandbox; path whitelist documented;
  audit commands added; env override warning.
- **Terminology**: in-panel legend separates E0–E4 (evidence strength) from A+/A/… (score grade);
  `NV = Not Verified` defined; coverage semantics documented.
- **Snapshot identity**: API now returns `snapshotFile`, `sha256`, `generatedAt`, `ageDays`, `stale`
  (14-day threshold); panel shows source + stale chip.
- **Errors**: missing/invalid snapshot now returns HTTP **422** with `code`, `searchedPaths`,
  `expectedSchema` (was 503).
- **Aggregation**: documented and versioned as `count-v1`; API echoes `countingRules`.
- **COI**: moved to the top of README and restated in the panel context.
- **License**: code MIT; data/name proprietary, SPDX `MIT AND LicenseRef-Proprietary-Data`.

## 0.1.0 — 2026-11-09

- First public release: host route + dock panel, tests, MIT license, security policy.
