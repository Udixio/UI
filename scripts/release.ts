import { releaseChangelog, releasePublish, releaseVersion } from 'nx/release';
import * as yargs from 'yargs';

/**
 * Release script for GitFlow workflow
 * 
 * This script is used in the GitFlow process:
 * 1. In the release workflow: Creates versions and changelogs on release branches
 * 2. In the publish workflow: Publishes packages after merging to main
 * 
 * It's designed to work with GitHub Actions workflows:
 * - pr-validation.yml: Validates PRs to develop and main
 * - release.yml: Creates release branches from develop
 * - publish.yml: Publishes packages when release PRs are merged to main
 */
(async () => {
  const options = await yargs
    .version(false) // don't use the default meaning of version in yargs
    .option('version', {
      description:
        'Explicit version specifier to use, if overriding conventional commits',
      type: 'string',
    })
    .option('dryRun', {
      alias: 'd',
      description:
        'Whether or not to perform a dry-run of the release process, defaults to true',
      type: 'boolean',
      default: true,
    })
    .option('verbose', {
      description:
        'Whether or not to enable verbose logging, defaults to false',
      type: 'boolean',
      default: false,
    })
    .option('skipPublish', {
      description:
        'Skip the publish step (useful for release preparation)',
      type: 'boolean',
      default: false,
    })
    .parseAsync();

  console.log(`Starting release process with options:`, {
    version: options.version || 'auto (from conventional commits)',
    dryRun: options.dryRun,
    verbose: options.verbose,
    skipPublish: options.skipPublish,
  });

  // Version step - updates version in package.json files
  const { workspaceVersion, projectsVersionData } = await releaseVersion({
    specifier: options.version,
    dryRun: options.dryRun,
    verbose: options.verbose,
  });

  console.log(`Versioning complete. Workspace version: ${workspaceVersion}`);

  // Changelog step - generates/updates CHANGELOG.md files
  await releaseChangelog({
    versionData: projectsVersionData,
    version: workspaceVersion,
    dryRun: options.dryRun,
    verbose: options.verbose,
  });

  console.log(`Changelog generation complete.`);

  // Publish step - publishes packages to npm
  if (!options.skipPublish) {
    console.log(`Starting publish process...`);
    // publishResults contains a map of project names and their exit codes
    const publishResults = await releasePublish({
      dryRun: options.dryRun,
      verbose: options.verbose,
    });

    const success = Object.values(publishResults).every((result) => result.code === 0);
    console.log(`Publish ${success ? 'succeeded' : 'failed'}.`);

    process.exit(success ? 0 : 1);
  } else {
    console.log(`Skipping publish step as requested.`);
    process.exit(0);
  }
})();
