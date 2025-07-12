module.exports = {
  npmPublish: true,
  repositoryUrl: 'https://github.com/Udixio/UI.git',
  branches: [
    {
      name: 'main',
      channel: 'latest'
    },
    {
      name: 'release/*',
      channel: 'latest'
    },
    {
      name: 'release/*',
      prerelease: '${name.replace(/^release\\//g, "")}',
    },
    {
      name: 'hotfix/*',
      prerelease: false,
    },
  ],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'angular',
        releaseRules: [
          { type: 'feat', release: 'minor' },
          { type: 'fix', release: 'patch' },
          { type: 'perf', release: 'patch' },
          { breaking: true, release: 'major' },
        ],
      },
    ],
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    [
      '@semantic-release/github',
      {
        assets: [
          'dist/index.js',
          'dist/ui.cjs.development.js',
          'dist/ui.cjs.production.min.js',
          'dist/ui.esm.js',
        ],
        failComment: false,
      },
    ],
    [
      '@semantic-release/npm',
      {
        npmPublish: true,
        pkgRoot: '.',
        tarballDir: 'dist',
        getNextVersion: (lastVersion, nextRelease) => {
          // Use the next distribution tag for minor releases
          if (nextRelease.type === 'minor') {
            nextRelease.channel = 'next';
          }
          // Use the beta distribution tag for major releases
          else if (nextRelease.type === 'major') {
            nextRelease.channel = 'beta';
          }
          return nextRelease.version;
        },
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['package.json', 'CHANGELOG.md'],
        message:
          'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
        noPush: true,
      },
    ],
  ],
};
