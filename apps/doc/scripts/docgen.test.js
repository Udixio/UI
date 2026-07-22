import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';
import {
  extractAngularComponent,
  extractReactRuntimeDefaults,
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
@NgComponent({ template: \`<ng-content />\` })
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

  assert.equal(result.description, 'Angular example.');
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
