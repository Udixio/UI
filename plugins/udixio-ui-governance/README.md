# Udixio UI Governance

Agent plugin that audits, synchronizes, and creates Udixio UI components across React,
Angular, core behavior, accessibility, and documentation.

It ships as a plugin for two agent harnesses from the same source tree:

- Claude Code — manifest in `.claude-plugin/plugin.json`, skills auto-discovered from `skills/`
- Codex — manifest in `.codex-plugin/plugin.json`, agent bindings in `skills/*/agents/openai.yaml`

The two manifests are separate files on purpose (no symlink), so the repository stays usable
on filesystems without symlink support.

## Install (Claude Code)

The repository root declares a local marketplace in `.claude-plugin/marketplace.json`, and
`.claude/settings.json` registers it for everyone working in this repo. Contributors are
prompted to trust and install the plugin on their first session — nothing else to do.

To install it manually, or to use it from another checkout:

```bash
claude plugin marketplace add ./          # from the repository root
claude plugin install udixio-ui-governance@udixio-ui
```

Verify with `claude plugin list`. Skills are then invocable as
`udixio-ui-governance:<skill-name>`.

## Skills

| Skill | Purpose |
| --- | --- |
| `audit-component` | End-to-end audit or repair of a component across every dimension below |
| `audit-public-api` | Review and stabilize the long-lived public contract before implementing or documenting |
| `audit-multiframework` | Check the framework-agnostic architecture shared by core, React, and Angular |
| `audit-parity` | Compare an Angular component against its React source and core contract |
| `audit-framework-quality` | Enforce React and Angular implementation conventions, typing, tests, and cleanup |
| `audit-accessibility` | Validate semantics, ARIA, keyboard/focus, contrast, motion, touch targets, and RTL |
| `audit-documentation` | Validate MDX overviews, TSDoc-derived API data, examples, and docgen freshness |
| `create-material-component` | Create a complete Material 3 component slice for React and Angular |
| `sync-angular-component` | Create or update an Angular component from its React source |
| `evolve-governance` | Update this plugin when repository architecture or standards change |

## Layout

```
plugins/udixio-ui-governance/
├── .claude-plugin/plugin.json   # Claude Code manifest
├── .codex-plugin/plugin.json    # Codex manifest
├── skills/<skill>/SKILL.md      # one directory per skill
├── references/                  # standards shared by the skills
└── scripts/                     # Python helpers used by the skills
```

`references/` holds the rules the skills cite rather than restate: public API standard,
accessibility standard, quality gates, audit report contract, Material 3 workflow, and the
repository map.

## Scripts

The Python helpers under `scripts/` run standalone and carry their own tests:

```bash
python3 -m pytest plugins/udixio-ui-governance/scripts/
```
