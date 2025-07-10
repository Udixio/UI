module.exports = {
  npmPublish: true,
  repositoryUrl: 'https://github.com/Udixio/UI.git',
  branches: [
    {
      name: 'main',
    },
    {
      name: 'develop',
      prerelease: true,
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
    '@semantic-release/commit-analyzer',
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
    '@semantic-release/npm',
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
