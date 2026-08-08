# Contributing to Udixio UI

Thanks for taking the time to contribute! This document covers the practical steps for setting up the project and submitting changes.

By participating, you're expected to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Project setup

This is an [Nx](https://nx.dev) monorepo managed with [pnpm](https://pnpm.io).

```bash
pnpm install
npx nx run-many -t build
npx nx run-many -t test
npx nx run-many -t lint
npx nx run apps-doc:dev   # documentation site at localhost
```

Node.js >= 18 is required (CI uses 18–24 depending on the workflow).

## Branching model

We follow [GitFlow](.github/README.md):

- `main` — production-ready, released code
- `develop` — integration branch, target for feature PRs
- `feature/*` — new features and fixes
- `release/v*` — release preparation (created by the release workflow)
- `hotfix/*` — urgent fixes on top of `main`

**Open pull requests against `develop`**, not `main`. `main` only receives merges from release/hotfix branches.

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/) to drive versioning and changelog generation:

- `feat: ...` — new feature (minor bump)
- `fix: ...` — bug fix (patch bump)
- `docs: ...`, `chore: ...`, `refactor: ...`, `test: ...` — no version bump
- `feat!: ...` or a `BREAKING CHANGE:` footer — major bump

## Pull requests

1. Fork/branch from `develop`.
2. Make your changes, following the existing code style (`eslint` / `prettier` are enforced in CI).
3. If you touch a component, keep the React and Angular implementations in parity — both live under `packages/ui-react` and `packages/ui-angular` on top of the shared `packages/core` contract.
4. Add or update tests and, if relevant, the docs in `apps/doc`.
5. Ensure `npx nx affected --target=lint,test,build` passes locally.
6. Open the PR against `develop` — the `PR Validation` workflow will run lint/test/build automatically.

## Reporting bugs / requesting features

Please use the issue templates when opening a GitHub issue. For security vulnerabilities, see [SECURITY.md](SECURITY.md) instead of opening a public issue.

## Releasing

Releases are handled by maintainers via the `Release Process` and `Publish Packages` workflows — see [.github/README.md](.github/README.md) for details. Contributors don't need to do anything beyond following the commit message convention above.
