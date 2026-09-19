import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';
import {
  extractAngularComponent,
  extractReactRuntimeDefaults,
  extractSvelteComponent,
  normalizeApiMember,
} from './docgen.js';

test('normalizes API members to the stable schema', () => {
  assert.deepEqual(
    normalizeApiMember({
      name: 'label',
      description: 'Visible label.',
      required: true,
      type: { name: 'string' },
      defaultValue: undefined,
      alias: 'aria-label',
    }),
    {
      name: 'label',
      description: 'Visible label.',
      required: true,
      type: { name: 'string' },
      defaultValue: null,
      alias: 'aria-label',
    },
  );
});

test('extracts React defaults from a props destructuring assignment', () => {
  assert.deepEqual(
    extractReactRuntimeDefaults(
      `
export const Example = (props: ExampleProps) => {
  const { variant = 'filled', disabled = false, label } = props;
  return null;
};
`,
      'Example',
    ),
    { variant: "'filled'", disabled: 'false' },
  );
});

test('extracts React defaults from a destructured function parameter', () => {
  assert.deepEqual(
    extractReactRuntimeDefaults(
      `export function Example({ size = 'medium', ...rest }: ExampleProps) {}`,
      'Example',
    ),
    { size: "'medium'" },
  );
});

test('extracts Angular signal APIs, JSDoc and projected content through ASTs', async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'udixio-docgen-'));
  context.after(() => rm(directory, { force: true, recursive: true }));
  const filePath = path.join(directory, 'example.ts');
  await writeFile(
    filePath,
    `
import {
  Component as NgComponent,
  input as ngInput,
  output as ngOutput,
} from '@angular/core';

/**
 * Angular example.
 * @devx Use projected content.
 * @a11y Has native semantics.
 */
@NgComponent({ selector: 'ng-example', template: \`<ng-content />\` })
export class Example {
  private observer?: MutationObserver;
  readonly title = ngInput.required<string>({ alias: 'heading' });
  readonly disabled = ngInput(false);
  readonly activeChange = ngOutput<boolean>();
}
`,
  );

  const program = ts.createProgram({
    rootNames: [filePath],
    options: {
      experimentalDecorators: true,
      strict: true,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const sourceFile = program.getSourceFile(filePath);
  const classDeclaration = sourceFile.statements.find(ts.isClassDeclaration);
  const result = extractAngularComponent({
    classDeclaration,
    checker: program.getTypeChecker(),
    reactComponent: {
      description: 'React example.',
      tags: {
        status: 'beta',
        devx: 'Use React children.',
        a11y: 'React-only guidance.',
        limitations: 'React-only limitation.',
      },
      props: {
        title: { description: 'Shared title.' },
        onActiveChange: { description: 'Reports active state.' },
      },
    },
  });

  // The description is shared and read once from core; no adapter carries one.
  assert.equal(result.description, undefined);
  assert.equal(result.selector, 'ng-example');
  assert.deepEqual(result.tags, {
    status: 'beta',
    devx: 'Use projected content.',
    a11y: 'Has native semantics.',
  });
  assert.equal(result.tags.limitations, undefined);
  assert.deepEqual(result.inputs.title, {
    name: 'title',
    description: 'Shared title.',
    required: true,
    type: { name: 'string' },
    defaultValue: null,
    alias: 'heading',
  });
  assert.equal(result.inputs.disabled.type.name, 'boolean');
  assert.deepEqual(result.inputs.disabled.defaultValue, { value: 'false' });
  assert.equal(
    result.outputs.activeChange.description,
    'Reports active state.',
  );
  assert.deepEqual(result.content, {
    default: {
      name: 'default',
      selector: '*',
      description: 'Default projected content.',
    },
  });
});

test('extracts Svelte props, bindables, defaults, snippets and TSDoc through ASTs', async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'udixio-docgen-'));
  context.after(() => rm(directory, { force: true, recursive: true }));
  const typesPath = path.join(directory, 'example.types.ts');
  const sveltePath = path.join(directory, 'Example.svelte');
  await writeFile(
    typesPath,
    `
import type { Snippet } from 'svelte';

/**
 * Svelte example.
 * @devx Use snippets.
 * @a11y Has native semantics.
 */
export interface SvelteExampleProps {
  /** Own title. */
  title: string;
  disabled?: boolean;
  /** Bindable value. */
  active?: boolean;
  onActiveChange?: (active: boolean) => void;
  children?: Snippet;
  /** Renders the trailing slot. */
  trailing?: Snippet<[{ active: boolean }]>;
}
`,
  );
  await writeFile(
    sveltePath,
    `<script lang="ts">
  import type { SvelteExampleProps } from './example.types';

  let {
    title,
    disabled = false,
    active = $bindable(),
    onActiveChange,
    children,
    trailing,
    ...rest
  }: SvelteExampleProps = $props();
</script>

<button {...rest}>{title}</button>
`,
  );

  // The fixture lives outside the workspace, so `svelte` is pointed at the
  // installed typings explicitly; a `Snippet` that resolved to `any` would
  // silently turn every snippet into a prop.
  const svelteTypes = path.join(
    path.dirname(fileURLToPath(import.meta.resolve('svelte/package.json'))),
    'types/index.d.ts',
  );
  const program = ts.createProgram({
    rootNames: [typesPath],
    options: {
      strict: true,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      baseUrl: directory,
      paths: { svelte: [svelteTypes] },
    },
  });
  const result = await extractSvelteComponent({
    displayName: 'Example',
    svelteFilePath: sveltePath,
    typesSourceFile: program.getSourceFile(typesPath),
    checker: program.getTypeChecker(),
    reactComponent: {
      tags: { status: 'beta', category: 'Action', limitations: 'React-only limitation.' },
      props: {
        title: { description: 'Shared title.' },
        disabled: { description: 'Shared disabled.' },
        onActiveChange: { description: 'Reports active state.' },
      },
    },
  });

  assert.equal(result.description, undefined);
  assert.deepEqual(result.tags, {
    status: 'beta',
    category: 'Action',
    devx: 'Use snippets.',
    a11y: 'Has native semantics.',
  });
  assert.deepEqual(result.props.title, {
    name: 'title',
    description: 'Own title.',
    required: true,
    type: { name: 'string' },
    defaultValue: null,
  });
  assert.deepEqual(result.props.disabled, {
    name: 'disabled',
    description: 'Shared disabled.',
    required: false,
    type: { name: 'boolean' },
    defaultValue: { value: 'false' },
  });
  assert.deepEqual(result.props.active, {
    name: 'active',
    description: 'Bindable value.',
    required: false,
    type: { name: 'boolean' },
    defaultValue: null,
    bindable: true,
  });
  assert.equal(result.props.onActiveChange.description, 'Reports active state.');
  assert.equal(result.props.children, undefined);
  assert.deepEqual(result.snippets, {
    children: { name: 'children', description: 'Default content.' },
    trailing: {
      name: 'trailing',
      description: 'Renders the trailing slot.',
      parameters: '[{ active: boolean; }]',
    },
  });
});
