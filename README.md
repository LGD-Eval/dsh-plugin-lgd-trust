# dsh-plugin-lgd-trust

A read-only **trust panel** for DeepSeek Harness: it shows a short summary of an
evaluation snapshot — evaluated/total coverage, score grades, NV count, lowest scores —
above the message box. **No network, no writes, no child processes.**

> **Conflict of interest, disclosed first.** The author of this plugin also authored
> **SkillGate**, one of the tools that appears in the evaluation data the panel can show.
> The plugin does not grade anything itself; it only displays a local snapshot. If the
> snapshot contains the author's tools, their grades were produced by the same author.
> Treat the panel as a transport of numbers, not as independent validation.

## What the numbers mean (two different scales)

| Term | Meaning |
|---|---|
| `E0–E4` | **Evidence strength** (E0 = none … E4 = externally reproduced with signature). This is *how well supported* a claim is — **not** a quality score. |
| `A+ / A / …` | **Score grade** from the snapshot's scoring rubric (a different scale). |
| `NV` | **Not Verified** — no evidence; **never** treated as a pass and never ranked in “lowest”. |
| `evaluated/total` | Counting rule `count-v1`: *evaluated* = `state === "evaluated"` and a numeric `score`; *NV* = everything else. |

The two scales are orthogonal: a high grade with no evidence should still be read as weak.

## Install

Requirements: a DeepSeek Harness version that supports plugin bundles (exact minimum **NV** — tested against the 2.0.x desktop build). Node is bundled with DSH.

```bash
# 1) local checkout (works today)
git clone https://github.com/LGD-Eval/dsh-plugin-lgd-trust.git
dsh plugin add ./dsh-plugin-lgd-trust
```

If your DSH build does not auto-link, add it to the profile manually:

```json
{
  "dependencies": { "dsh-plugin-lgd-trust": "link:/absolute/path/to/dsh-plugin-lgd-trust" },
  "dsh": { "profile": { "bundles": ["@deepseek-ai/dsh-base", "...", "dsh-plugin-lgd-trust"] } }
}
```

Then **fully quit and reopen** DSH. (GUI restart, not just closing the window.)

Uninstall:

```bash
dsh plugin remove dsh-plugin-lgd-trust
# or remove the dependency + bundle entry from the profile package.json, then restart
```

npm/git+tag install: **NV** (not published yet). This README will be updated when it is.

## Data source

The plugin reads one JSON file (array of `{slug, score, grade, state, critical?}`).
Resolution order:

1. `LGD_TRUST_SNAPSHOT` — explicit local override; **the file you point at is read as-is**;
2. `~/.dsh/lgd-trust/skills187-eval.json`;
3. `D:/deepseek-harness/default-workspace/work/eval-run/skills187-eval.json` (workspace default).

The API returns `snapshotFile`, `sha256`, `generatedAt`, `ageDays`, `stale` so you can see
**which** file was read and **how old** it is. A file older than 14 days is flagged `stale`.

Route: `GET /api/lgd-trust/summary` (GET/HEAD only). Missing/invalid snapshot → **HTTP 422**
with `searchedPaths` and `expectedSchema` (not 503 — it is a configuration problem, not an
outage).

## Security posture — a declaration, not a sandbox

The code has no network calls, no writes, no child processes, and renders text via React
(no raw HTML). **This is a claim about the code, not runtime enforcement**: whether DSH
sandboxes plugins is **NV**. You can audit it:

```bash
grep -nE "https?://|fetch\(|net\.|http\.|writeFile|createWriteStream|child_process|spawn" index.js client.js
cat package.json   # no dependencies, no postinstall
```

Only point `LGD_TRUST_SNAPSHOT` at files you trust. See [SECURITY.md](SECURITY.md).

## Aggregation rules (versioned)

`count-v1`: evaluated = `state === "evaluated"` with numeric `score`; NV = everything else;
lowest = five evaluated entries sorted by `score` ascending; NV entries are never ranked.
The API echoes `countingRules`.

## License

Code: **MIT** (see LICENSE). Evaluation data and the “LGD” name: © 2026 Xinghua Zhao, not
covered by MIT. SPDX-style: `MIT AND LicenseRef-Proprietary-Data`.

---

## 中文说明

只读信任面板：在输入框上方显示评测快照概要（已评测/总数、等级分布、NV 数量、最低分），
**无网络、不写入、不启动子进程**。

**利益冲突先披露**：本插件作者同时是 SkillGate 的作者，而 SkillGate 会出现在可展示的评测数据里。
面板本身不打分，只显示本地快照；作者工具的分级由作者产生，**不构成独立验证**。

**两套标尺**：`E0–E4` 是证据强度（不是质量分）；`A+/A/…` 是评分等级；`NV = 未验证`，**不等于通过**，
也不进入“最低分”排名。`evaluated/total` 采用 `count-v1` 口径。

安装：`git clone` 后 `dsh plugin add ./dsh-plugin-lgd-trust`；或 profile 里加依赖 + bundles，完全退出重启 DSH。
卸载：`dsh plugin remove dsh-plugin-lgd-trust`，或删 profile 条目后重启。

安全声明是“代码没有网络/写/子进程”，**不是运行时沙箱**（DSH 是否隔离插件：NV）；可用 README 里的 grep 命令自查。
