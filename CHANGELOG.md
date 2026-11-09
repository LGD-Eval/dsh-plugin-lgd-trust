# Changelog

## 0.1.0 — 2026-11-09

- First public release.
- Host: `GET /api/lgd-trust/summary` (read-only; no network/writes).
- Client: compact panel in `conversation.input.dock` — coverage, grade chips, NV count,
  expandable lowest-score list, refresh.
- Snapshot resolution: `LGD_TRUST_SNAPSHOT` → `~/.dsh/lgd-trust/skills187-eval.json` →
  workspace default; missing/invalid file returns HTTP 503.
- Tests: `node --test tests/` (summarize contract).
