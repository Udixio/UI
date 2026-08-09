# Udixio UI Usage

Agent plugin that helps agents correctly **consume** `@udixio/ui-react` and `@udixio/ui-angular`
in a downstream project — as opposed to
[`udixio-ui-governance`](../udixio-ui-governance), which is for maintaining the component
library itself and is not meant for consumer projects.

It ships as a plugin for two agent harnesses from the same source tree:

- Claude Code — manifest in `.claude-plugin/plugin.json`, skill auto-discovered from `skills/`
- Codex — manifest in `.codex-plugin/plugin.json`, agent binding in `skills/consume-component/agents/openai.yaml`

The two manifests are separate files on purpose (no symlink), so the repository stays usable
on filesystems without symlink support.

## Install (Claude Code)

For contributors working in this repository, the repository root declares a local marketplace in
`.claude-plugin/marketplace.json`, and `.claude/settings.json` registers this plugin (alongside
`udixio-ui-governance`) for everyone working here — nothing else to do.

For a downstream project consuming `@udixio/ui-react` or `@udixio/ui-angular` — the plugin's
actual target audience — install it there explicitly:

```bash
claude plugin marketplace add https://github.com/Udixio/UI
claude plugin install udixio-ui-usage@udixio-ui
```

Verify with `claude plugin list`. Skills are then invocable as `udixio-ui-usage:<skill-name>`.

## Skills

| Skill | Purpose |
| --- | --- |
| `consume-component` | Resolve a component's exact installed API (TSDoc) plus current usage patterns (live docs), then apply the right React/Angular conventions before writing code |
| `review-usage` | Check code that already uses Udixio UI against the installed API: invented props, wrong selectors, controlled/uncontrolled mistakes, unmet `@a11y`, violated `@limitations` |
| `migrate-to-udixio` | Convert existing UI code (Material UI, Bootstrap, hand-rolled Tailwind…) to Udixio components and theme tokens, discovering equivalents from the live catalog |

## Design

- No custom tools, no bundled data, no MCP server: the skills only use generic file reads (for
  the installed package's own shipped TSDoc — always exact for whatever version is installed)
  and `WebFetch` against the public markdown mirror at
  `https://ui.udixio.fr/components/<slug>.<framework>.md` (usage prose and examples, narrowed to
  the framework the project actually installed). If the installed typings and the live docs
  disagree, the installed typings win.
- `migrate-to-udixio` discovers equivalents from the live catalog at
  `https://ui.udixio.fr/components.md` rather than a mapping table checked into this repo — a
  static table would go stale the moment a component is added or renamed.
- This keeps the plugin free of the staleness problem that affected the former `@udixio/mcp`
  bundled-snapshot approach (now deprecated) — there's nothing here to resynchronize.

## Layout

```
plugins/udixio-ui-usage/
├── .claude-plugin/plugin.json           # Claude Code manifest
├── .codex-plugin/plugin.json            # Codex manifest
├── references/                          # conventions shared by every skill
│   ├── react-conventions.md
│   └── angular-conventions.md
└── skills/<skill>/
    ├── SKILL.md
    └── agents/openai.yaml               # Codex agent binding
```
