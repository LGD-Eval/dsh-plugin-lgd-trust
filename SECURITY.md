# Security policy

## Posture — declaration, not enforcement

`dsh-plugin-lgd-trust` is deliberately minimal:

- **No network access** (no `fetch`, `http`, `net`).
- **No writes** (no `fs.write*`), **no child processes** (no `child_process`).
- **One file read**: a JSON snapshot resolved from a two-path whitelist, or an explicit
  `LGD_TRUST_SNAPSHOT` override. `path.resolve` only; no globbing, no recursion.
- **Route**: `GET/HEAD /api/lgd-trust/summary` only; other methods → 405.
- **Client**: React text rendering only; no `dangerouslySetInnerHTML`.
- **No dependencies, no postinstall.**

**Important:** the above describes the code. It is **not** a claim that DSH enforces a
capability sandbox on plugins. Whether DSH can isolate a plugin's filesystem/network is
**NV** (not verified here). Audit the code yourself with the commands in README.

## Threat model

| Threat | Mitigation |
|---|---|
| Malicious snapshot (huge/invalid JSON) | Parse errors → HTTP 422 with `code` + `searchedPaths`; host keeps running |
| Path traversal via `LGD_TRUST_SNAPSHOT` | Env var is an explicit local override; the plugin reads exactly that file. Only point it at trusted files |
| XSS via skill names | React text rendering; no raw HTML |
| Secret leakage | No credential reads; only the snapshot path env var |
| Supply chain | No dependencies, no postinstall; single-file host/client |

## Reporting

Open an issue at https://github.com/LGD-Eval/dsh-plugin-lgd-trust/issues. For unpatched
vulnerabilities, ask for a private channel first.

## Supported versions

Latest minor only. Minimum DSH version: **NV** (tested on 2.0.x desktop).
