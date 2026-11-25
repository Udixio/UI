/**
 * The live preview of an HTML example (`src/examples/html/<name>.html`) runs the example itself: its markup is rendered as
 * written (HtmlExample.astro), and its `<script type="module">` runs as written, bundled by the doc's own bundler, so that
 * its `@udixio/motion` and `@udixio/motion/<entry>` imports resolve to the runtime the page already runs
 * (`htmlExamplesPlugin` below, in astro.config.ts).
 *
 * One line is left out: `connectMotion()`. The layout connects the runtime to the whole document, right after it has run
 * the examples of the page (layouts/layout.astro, lib/html-example-runner.ts): a second scanner would bind every element
 * twice. An example that imports anything other than `@udixio/motion` cannot be shown as the code that runs, and the
 * build stops on it.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

/** The modules an HTML example may import: the runtime and its entries. */
const ALLOWED_IMPORT = /^@udixio\/motion(?:\/[\w-]+)*$/;
/** An import statement, on one line or several, and the module it imports. */
const IMPORT_STATEMENT = /^[ \t]*import\b[^;]*?['"]([^'"\n]+)['"][ \t]*;?[ \t]*$/gm;
/** The line the layout runs in its place: it connects the runtime, once the examples of the page have run. */
const DONE_BY_THE_PAGE = /^[ \t]*connectMotion\(\);[ \t]*(?:\/\/.*)?$/gm;

export type HtmlExampleParts = {
  /** The markup, rendered as written. */
  markup: string;
  /** The import statements of the script. */
  imports: string[];
  /** The rest of the script, without its imports and the `connectMotion()` that the layout runs in its place. */
  body: string;
};

/** The markup and script of an HTML example; throws when the script imports a module the preview cannot run. */
export function htmlExampleParts(source: string, name: string): HtmlExampleParts {
  const [markup, rest = ''] = source.split(/<script type="module">/);
  const script = rest.replace(/<\/script>\s*$/, '');
  const imports: string[] = [];
  const body = script
    .replace(IMPORT_STATEMENT, (statement, specifier: string) => {
      if (!ALLOWED_IMPORT.test(specifier)) {
        throw new Error(
          `HtmlExample: "${name}" imports "${specifier}"; a live HTML example may import @udixio/motion and its entries only`,
        );
      }
      imports.push(statement.trim());
      return '';
    })
    .replace(DONE_BY_THE_PAGE, '')
    .trim();
  return { markup, imports, body };
}

/** The module of an example's script: its imports, and its body as `run()`, called once per rendered example. */
export function htmlExampleModule(parts: HtmlExampleParts): string {
  return `${parts.imports.join('\n')}\nexport default async function run() {\n${parts.body}\n}\n`;
}

const INDEX = 'virtual:udixio/html-examples';
const EXAMPLE = 'virtual:udixio/html-example/';

/**
 * `virtual:udixio/html-examples` exports `htmlExamples`, a loader per HTML example that has a script; each loads
 * `virtual:udixio/html-example/<name>`, the example's script as a module (`htmlExampleModule`).
 */
export function htmlExamplesPlugin(directory: string): Plugin {
  const fileOf = (name: string) => join(directory, `${name}.html`);
  return {
    name: 'udixio:html-examples',
    resolveId(id) {
      if (id === INDEX || id.startsWith(EXAMPLE)) return `\0${id}`;
      return undefined;
    },
    load(id) {
      if (id === `\0${INDEX}`) {
        const names = readdirSync(directory)
          .filter((file) => /^motion-.*\.html$/.test(file))
          .map((file) => file.replace(/\.html$/, ''))
          .filter((name) => {
            this.addWatchFile(fileOf(name));
            return htmlExampleParts(readFileSync(fileOf(name), 'utf8'), name).body !== '';
          });
        const entries = names.map((name) => `  ${JSON.stringify(name)}: () => import(${JSON.stringify(EXAMPLE + name)}),`);
        return `export const htmlExamples = {\n${entries.join('\n')}\n};\n`;
      }
      if (id.startsWith(`\0${EXAMPLE}`)) {
        const name = id.slice(`\0${EXAMPLE}`.length);
        const file = fileOf(name);
        this.addWatchFile(file);
        return htmlExampleModule(htmlExampleParts(readFileSync(file, 'utf8'), name));
      }
      return undefined;
    },
  };
}
