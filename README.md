# dsh-plugin-lgd-trust

Read-only trust panel for **DeepSeek Harness**. Shows a compact summary of evaluated AI
agent skills — coverage, evidence grades, NV count, lowest scores — inside the conversation
dock. **No network, no writes, no spawning.**

[中文说明见下方](#中文说明)。

## What it shows

- `evaluated / total` coverage (default dataset: the public 187-entry skill registry snapshot);
- grade distribution (A+ / A / …);
- `NV` count (not verified) — **NV is never presented as a pass**;
- expandable list of the lowest-scoring entries;
- data source path and a one-line policy note.

## Install (local, for testing)

```bash
dsh plugin add /path/to/dsh-plugin-lgd-trust
```

or add to the profile `package.json`:

```json
"dependencies": { "dsh-plugin-lgd-trust": "link:/path/to/dsh-plugin-lgd-trust" }
```

and add `dsh-plugin-lgd-trust` to `dsh.profile.bundles`. Restart DSH.

## Data

The plugin reads one local JSON file (an array of `{slug, score, grade, state, critical}`).
Resolution order:

1. `LGD_TRUST_SNAPSHOT` (absolute path; documented, no traversal);
2. `~/.dsh/lgd-trust/skills187-eval.json`;
3. the workspace default path.

If the file is missing or invalid, the panel shows an error and the route returns HTTP 503.

Route: `GET /api/lgd-trust/summary` (GET/HEAD only).

## Security posture

- no network calls, no writes, no child processes;
- one file read from an allow-listed path;
- the client renders text only (React escapes values); no HTML injection;
- see [SECURITY.md](SECURITY.md) for the threat model and reporting.

## Honesty notes

- Evidence grades are **E2 (author-reproducible)** unless a dataset says otherwise;
- `NV` entries are reported as NV, never as pass;
- this panel does **not** re-score anything — it only transports numbers.

## License

MIT for code. Text and data remain © 2026 Xinghua Zhao.

---

## 中文说明

只读信任面板：在对话输入区上方显示已评测技能概览（覆盖数、等级分布、NV 数、最低分条目），
点“详情”展开。**无网络、不写入、不启动子进程**；数据来自一个本地 JSON 快照。

安装：`dsh plugin add <本目录>`，或 profile 里加依赖 + bundles，重启 DSH。

诚实边界：默认数据是 **E2（作者可复现）**；`NV` 不等于通过；面板不重新打分，只搬运数字。
