# Udixio UI Governance

Agent plugin that audits, synchronizes, and creates Udixio UI components across React,
Angular, Svelte, core behavior, accessibility, and documentation.

It ships as a plugin for two agent harnesses from the same source tree:

- Claude Code — manifest in `.claude-plugin/plugin.json`, skills auto-discovered from `skills/`
- Codex — manifest in `.codex-plugin/plugin.json`, agent bindings in `skills/*/agents/openai.yaml`

The two manifests are separate files on purpose (no symlink), so the repository stays usable
on filesystems without symlink support.

## Install (Codex)

```bash
codex plugin marketplace add ./          # from the repository root, once
codex plugin add udixio-ui-governance@udixio-ui
```

Verify with `codex plugin list`. Skills are then invocable as `$<skill-name>`.

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
| `audit-multiframework` | Check the framework-agnostic architecture shared by core, React, Angular, and Svelte |
| `audit-parity` | Compare an Angular or Svelte adapter against its React source and core contract |
| `audit-framework-quality` | Enforce React, Angular, and Svelte implementation conventions, typing, tests, and cleanup |
| `audit-accessibility` | Validate semantics, ARIA, keyboard/focus, contrast, motion, touch targets, and RTL |
| `audit-documentation` | Validate MDX overviews, TSDoc-derived API data, examples, and docgen freshness |
| `create-material-component` | Create a complete Material 3 component slice for React, Angular, and Svelte |
| `sync-angular-component` | Create or update an Angular component from its React source |
| `sync-svelte-component` | Create or update a Svelte 5 component from its React source |
| `evolve-governance` | Update this plugin when repository architecture or standards change |

## Blocking findings

Two finding families stop an audit and require the user's decision instead of an automatic fix.

| Finding | Emitted by | Meaning |
| --- | --- | --- |
| `API-DESIGN-*` | `audit-public-api`, `audit-parity`, `sync-angular-component`, `sync-svelte-component` | A public name or contract is ambiguous, negative, or implementation-shaped |
| `FORM-*` | `sync-angular-component`, `sync-svelte-component` | An adapter should deliver the concept through a different shape — directive, action, service, pipe — than the source adapter |

`MULTI-OWNERSHIP-*`, emitted by `audit-multiframework`, is not blocking: it reports shared imperative
logic that belongs in `@udixio/core/dom` rather than in a framework hook.

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
accessibility standard, quality gates, audit report contract, Material 3 workflow, the
repository map, and one conventions page per target adapter (Angular, Svelte).

## Scripts

The Python helpers under `scripts/` run standalone and carry their own tests:

```bash
python3 -m pytest plugins/udixio-ui-governance/scripts/
```
