# GitFlow Release Process with GitHub Actions

This repository uses GitFlow for managing releases with GitHub Actions. This document explains the workflow and how to use it.

## Branching Strategy

We follow the GitFlow branching model:

- `main`: Production-ready code
- `develop`: Development branch where features are integrated
- `feature/*`: Feature branches for new development
- `release/v*`: Release branches for preparing new releases
- `hotfix/*`: Hotfix branches for urgent production fixes

## Workflows

### PR Validation (`pr-validation.yml`)

This workflow runs automatically when pull requests are created or updated against the `develop` or `main` branches.

It performs:
- Linting
- Testing
- Building

### Release Process (`release.yml`)

This workflow is manually triggered to create a new release from the `develop` branch.

To start a release:
1. Go to the "Actions" tab in GitHub
2. Select the "Release Process" workflow
3. Click "Run workflow"
4. Optionally specify a version (if left empty, it will be determined from conventional commits)
5. Choose whether to run in dry-run mode

The workflow will:
1. Create a release branch from `develop`
2. Update versions and generate changelogs
3. Create a pull request to `main`

### Publish Packages (`publish.yml`)

This workflow runs automatically when a release pull request is merged to `main`.

It performs:
1. Creating a GitHub release with the changelog
2. Publishing packages to npm
3. Merging changes back to `develop`

## Development Workflow

1. Create feature branches from `develop`
2. Make changes and commit using conventional commit messages
3. Create a PR to merge back to `develop`
4. When ready to release, run the Release Process workflow
5. Review the release PR and merge to `main`
6. The Publish workflow will automatically run to publish packages

## Conventional Commits

We use conventional commits to automatically determine version numbers and generate changelogs. Please follow this format for your commit messages:

- `feat: add new feature` (triggers a minor version bump)
- `fix: fix a bug` (triggers a patch version bump)
- `docs: update documentation` (no version bump)
- `chore: update dependencies` (no version bump)
- `BREAKING CHANGE: major change` (triggers a major version bump)

## Manual Release

If you need to manually specify a version instead of using conventional commits, you can provide the version when running the Release Process workflow.