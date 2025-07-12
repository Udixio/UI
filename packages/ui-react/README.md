# @udixio/ui

A React component library built with TypeScript and Tailwind CSS, providing a set of reusable UI components for building modern web applications.

## Installation

```bash
npm install @udixio/ui
# or
yarn add @udixio/ui
```

## Usage

```jsx
import { Button } from '@udixio/ui';

function App() {
  return (
    <Button variant="filled" color="primary">
      Click me
    </Button>
  );
}
```

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn
```

### Development Commands

- `npm start` or `yarn start`: Start Storybook for component development
- `npm run build` or `yarn build`: Build the library
- `npm run test` or `yarn test`: Run tests
- `npm run lint` or `yarn lint`: Run linting

## Documentation

Component documentation is available through Storybook. Run `npm start` to view the documentation locally.

## Release Channels

The library is published to npm with different distribution tags based on the type of version update:

- `latest`: Stable releases with patch updates (bug fixes)
- `next`: Minor version updates with new features
- `beta`: Major version updates with breaking changes

### Installing Specific Versions

```bash
# Install the latest stable version
npm install @udixio/ui

# Install the latest release candidate with new features
npm install @udixio/ui@next

# Install the latest beta version with breaking changes
npm install @udixio/ui@beta
```

## Branch Strategy

Our repository uses GitFlow for development:

- `main`: Contains stable production code
- `develop`: Development branch for ongoing work
- `release/*`: Release branches for preparing new versions
- `feature/*`: Feature branches for new features
- `hotfix/*`: Hotfix branches for urgent fixes

The distribution tags (`latest`, `next`, `beta`) are determined by the type of version update:
- Patch updates (bug fixes) are published with the `latest` tag
- Minor updates (new features) are published with the `next` tag
- Major updates (breaking changes) are published with the `beta` tag

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

When contributing, please follow these GitFlow guidelines:

1. Create a feature branch from `develop` for your work: `feature/your-feature-name`
2. When ready, create a PR to merge your feature branch into `develop`
3. For releases:
   - Create a release branch from `develop`: `release/x.y.z`
   - Make any final adjustments and fixes in the release branch
   - When ready, the release branch will be merged into `main` and tagged

When your changes are merged into a release branch and pushed, semantic-release will:
- Determine the version update type based on your commit messages
- Publish the package with the appropriate distribution tag based on the version type:
  - Patch updates → `@latest`
  - Minor updates → `@next`
  - Major updates → `@beta`

## License

MIT
