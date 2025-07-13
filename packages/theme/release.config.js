module.exports = {
  npmPublish: true,
  repositoryUrl: 'https://github.com/Udixio/tailwind-material.git',
  branches: ['master', 'next', { name: 'beta', prerelease: true }],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    '@semantic-release/npm',
    [
      '@semantic-release/github',
      {
        assets: ['dist/**', '*.tgz'],
      },
    ],

    '@semantic-release/git',
  ],
};
