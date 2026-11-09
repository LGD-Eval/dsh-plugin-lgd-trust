# Security policy

## Posture

`dsh-plugin-lgd-trust` is deliberately minimal:

- **No network access** (no fetch/http/net imports).
- **No writes** (no fs.write*, no child processes).
- **One file read**: a JSON snapshot resolved via `LGD_TRUST_SNAPSHOT` or the
  documented default paths. The value is `path.resolve`d; no globbing, no
  traversal into directories.
- **Route**: `GET/HEAD /api/lgd-trust/summary` only; other methods return 405.
- **Client**: renders strings via React (auto-escaped); it never uses
  `dangerouslySetInnerHTML`.

## Threat model

| Threat | Mitigation |
|---|---|
| Malicious snapshot file (huge / invalid JSON) | Read is best-effort; parse errors return HTTP 503 without crashing the host; file is local and user-controlled |
| Path traversal via `LGD_TRUST_SNAPSHOT` | Env var is an explicit local override; the plugin reads exactly that file (no listing, no recursion). Only set it to files you trust |
| XSS via skill names | React text rendering; no raw HTML |
| Secret leakage | The plugin does not read credentials or env vars other than the documented path |
| Supply-chain | Single dependency-free file set; no postinstall scripts |

## Reporting

Open an issue at https://github.com/LGD-Eval/dsh-plugin-lgd-trust/issues or email the
maintainer listed in package.json. Please do not open public issues for unpatched
vulnerabilities if they could be exploited; ask for a private channel first.

## Supported versions

Only the latest published minor version is supported.
