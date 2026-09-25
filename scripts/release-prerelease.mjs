import { execFileSync } from 'node:child_process';

import { release, releasePublish } from 'nx/release';

// Keep Nx's version data between versioning and publishing. Running these as
// separate CLI commands would make publish lose the release selection.
const tag = process.env.TAG;
const branchName = process.env.GITHUB_REF_NAME;
const dryRun = process.argv.includes('--dry-run');

if (!tag) {
  throw new Error('TAG is required to publish a prerelease');
}

if (!['beta', 'next'].includes(tag)) {
  throw new Error(`Unsupported prerelease tag: ${tag}`);
}

const releaseResult = await release({
  dryRun,
  preid: tag,
  skipPublish: true,
  verbose: true,
});

const versionedProjects = Object.entries(releaseResult.projectsVersionData)
  .filter(
    ([, versionData]) =>
      versionData.newVersion !== null ||
      (versionData.dockerVersion !== null &&
        versionData.dockerVersion !== undefined),
  )
  .map(([projectName]) => projectName);

if (dryRun) {
  console.log(
    `Would publish ${versionedProjects.length} project(s): ${versionedProjects.join(', ') || 'none'}`,
  );
  process.exit(0);
}

if (versionedProjects.length === 0) {
  console.log('No project received a new version; nothing to publish.');
  process.exit(0);
}

if (!branchName) {
  throw new Error('GITHUB_REF_NAME is required to push a prerelease');
}

// Nx has already committed and tagged the version bump. Refresh workspace
// links without changing the lockfile, then push the commit and tags as one
// operation.
execFileSync('pnpm', ['install', '--frozen-lockfile'], { stdio: 'inherit' });
execFileSync(
  'git',
  [
    'push',
    '--atomic',
    'origin',
    `HEAD:refs/heads/${branchName}`,
    '--follow-tags',
  ],
  { stdio: 'inherit' },
);

const publishResults = await releasePublish({
  releaseGraph: releaseResult.releaseGraph,
  tag,
  verbose: true,
  versionData: releaseResult.projectsVersionData,
});

const failedProjects = Object.entries(publishResults)
  .filter(([, result]) => result.code !== 0)
  .map(([projectName]) => projectName);

if (failedProjects.length > 0) {
  throw new Error(`Failed to publish: ${failedProjects.join(', ')}`);
}
