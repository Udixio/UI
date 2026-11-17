import { mkdtemp, readFile, writeFile, mkdir, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const src = path.resolve(fileURLToPath(new URL('../src/', import.meta.url)));
const realSrc = await realpath(src);
const target = new URL('../motion-manifest.json', import.meta.url);
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const temp = await mkdtemp(path.join(tmpdir(), 'motion-manifest-'));

/** The public names of a source module: its exports, and those of every `export *` it re-exports, in the source's own order. */
async function publicNames(file, seen = new Set()) {
  const resolved = path.resolve(file);
  if (seen.has(resolved)) return new Set();
  seen.add(resolved);
  const text = await readFile(resolved, 'utf8');
  const parsed = ts.createSourceFile(resolved, text, ts.ScriptTarget.Latest, true);
  const names = new Set();
  const isExported = node => (ts.getModifiers(node) ?? []).some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword);
  for (const statement of parsed.statements) {
    if (ts.isVariableStatement(statement) && isExported(statement)) {
      for (const declaration of statement.declarationList.declarations) if (ts.isIdentifier(declaration.name)) names.add(declaration.name.text);
    } else if ((ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement) || ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement) || ts.isEnumDeclaration(statement)) && isExported(statement) && statement.name) {
      names.add(statement.name.text);
    } else if (ts.isExportDeclaration(statement)) {
      const clause = statement.exportClause;
      if (!clause) {
        // export * from './x.js': every name of the target, except its default export.
        const specifier = statement.moduleSpecifier.text;
        if (!specifier.startsWith('./') && !specifier.startsWith('../')) throw new Error(`External export forbidden: ${specifier}`);
        for (const name of await publicNames(path.join(path.dirname(resolved), specifier.replace(/\.js$/, '.ts')), seen)) names.add(name);
      } else if (ts.isNamedExports(clause)) {
        for (const element of clause.elements) names.add(element.name.text);
      } else names.add(clause.name.text);
    }
  }
  return names;
}

/** Each entry of the package whose development source is a TypeScript file, with the names it exports. */
async function entries() {
  const found = [];
  for (const [key, value] of Object.entries(pkg.exports)) {
    if (typeof value !== 'object' || typeof value.development !== 'string' || !value.development.endsWith('.ts')) continue;
    const name = key === '.' ? pkg.name : `${pkg.name}${key.slice(1)}`;
    const names = await publicNames(new URL(value.development, new URL('../', import.meta.url)).pathname);
    found.push({ name, source: value.development.replace(/^\.\//, ''), exports: [...names].sort() });
  }
  return found.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

/** Option names of each verb, derived from the lists the validator reads. */
function verbTable(manifest) {
  const { spec, domains } = manifest;
  const options = ['timing', 'reduced', 'interrupt', 'stagger', 'origin', 'split', 'exit', 'shared', 'repeat', 'axis', 'range', 'pause', 'reason'];
  const takes = (verb, option) => {
    if (option === 'timing') return !spec.untimedVerbs.includes(verb);
    if (option === 'reduced') return true;
    if (option === 'interrupt') return spec.interruptVerbs.includes(verb);
    if (option === 'stagger' || option === 'origin') return spec.staggerVerbs.includes(verb);
    if (option === 'split') return spec.splitVerbs.includes(verb);
    if (option === 'exit') return spec.exitVerbs.includes(verb);
    if (option === 'shared') return spec.sharedVerbs.includes(verb);
    if (option === 'repeat') return spec.repeatVerbs.includes(verb);
    if (option === 'axis') return spec.axisVerbs.includes(verb);
    if (option === 'range') return spec.rangeVerbs.includes(verb);
    if (option === 'pause') return spec.pauseVerbs.includes(verb);
    if (option === 'reason') return spec.reasonVerbs.includes(verb);
    return false;
  };
  return Object.fromEntries(domains.supportedVerbs.map(verb => [verb, {
    keyframes: spec.keyframesOptionalVerbs.includes(verb) ? 'optional' : 'required',
    timing: spec.untimedVerbs.includes(verb) ? 'none' : spec.curveTimingVerbs.includes(verb) ? 'curve' : 'spring-or-curve',
    options: options.filter(option => takes(verb, option)),
  }]));
}

const kebab = name => name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

try {
  await writeFile(path.join(temp, 'package.json'), '{"type":"module"}');
  const visited = new Set();
  async function compile(relative) {
    if (visited.has(relative)) return;
    visited.add(relative);
    const input = path.resolve(src, relative);
    if (!input.startsWith(src + path.sep)) throw new Error('Import outside src');
    const resolved = await realpath(input);
    if (!resolved.startsWith(realSrc + path.sep)) throw new Error('Import outside src');
    const text = await readFile(resolved, 'utf8');
    const result = ts.transpileModule(text, { fileName: input, reportDiagnostics: true, compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
    if (result.diagnostics?.some(d => d.category === ts.DiagnosticCategory.Error)) throw new Error(ts.formatDiagnostics(result.diagnostics, {getCanonicalFileName: x => x, getCurrentDirectory: () => src, getNewLine: () => '\n'}));
    const parsed = ts.createSourceFile(input, text, ts.ScriptTarget.Latest, true);
    function rejectUnanalysed(node) {
      if (ts.isImportEqualsDeclaration(node) || ts.isImportTypeNode(node) ||
          (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === 'require')))) {
        throw new Error(`Unsupported import in ${relative}`);
      }
      ts.forEachChild(node, rejectUnanalysed);
    }
    rejectUnanalysed(parsed);
    for (const statement of parsed.statements) {
      if ((ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
        const specifier = statement.moduleSpecifier.text;
        if (!specifier.startsWith('./') && !specifier.startsWith('../')) throw new Error(`External import forbidden: ${specifier}`);
        if (!specifier.endsWith('.js')) throw new Error(`Expected .js import: ${specifier}`);
        const dependency = path.normalize(path.join(path.dirname(relative), specifier.slice(0, -3) + '.ts'));
        await compile(dependency);
      }
    }
    const output = path.join(temp, relative.replace(/\.ts$/, '.js'));
    await mkdir(path.dirname(output), {recursive:true});
    await writeFile(output, result.outputText);
  }
  await compile('manifest.ts');
  await compile('presets.ts');
  await compile('tokens.ts');
  const { motionManifest } = await import(pathToFileURL(path.join(temp, 'manifest.js')).href);
  const presets = await import(pathToFileURL(path.join(temp, 'presets.js')).href);
  const { defineTokens } = await import(pathToFileURL(path.join(temp, 'tokens.js')).href);
  // Every preset is a definition of presets.ts: its validated spec, keyed by name.
  const presetSpecs = Object.fromEntries(
    Object.values(presets)
      .map(ref => [ref.name, ref.spec])
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  );
  const tokens = defineTokens();
  const scheme = name => defineTokens({ scheme: name });
  const expressive = scheme('expressive');
  const standard = scheme('standard');
  const springs = {};
  for (const speed of ['fast', 'default', 'slow'])
    for (const type of ['spatial', 'effects']) {
      const pick = ({ dampingRatio, stiffness }) => ({ dampingRatio, stiffness });
      springs[`spring.${speed}.${type}`] = {
        expressive: pick(expressive.spring[speed][type]),
        standard: pick(standard.spring[speed][type]),
      };
    }
  const cssNames = (group, keys) => Object.fromEntries(keys.map(key => [key, `--udx-motion-${group}-${kebab(key)}`]));
  const output = {
    ...motionManifest,
    verbs: verbTable(motionManifest),
    presets: presetSpecs,
    tokens: {
      duration: { ...tokens.duration },
      easing: { ...tokens.easing },
      distance: { ...tokens.distance },
      stagger: { ...tokens.stagger },
      springs,
      css: {
        scale: '--udx-motion-scale',
        value: '--udx-motion-value-<name>',
        duration: cssNames('duration', Object.keys(tokens.duration)),
        easing: cssNames('easing', Object.keys(tokens.easing)),
        distance: cssNames('distance', Object.keys(tokens.distance)),
        stagger: cssNames('stagger', Object.keys(tokens.stagger)),
        spring: Object.fromEntries(Object.keys(springs).map(ref => {
          const [, speed, type] = ref.split('.');
          return [`${speed}.${type}`, { duration: `--udx-motion-spring-${speed}-${type}-duration`, easing: `--udx-motion-spring-${speed}-${type}-easing` }];
        })),
      },
    },
    entries: await entries(),
  };
  const text = `${JSON.stringify(output, null, 2)}\n`;
  if (process.argv.includes('--check')) {
    if (await readFile(target, 'utf8').catch(() => '') !== text) { console.error('Motion manifest is stale; run node scripts/generate-motion-manifest.mjs'); process.exitCode = 1; }
  } else await writeFile(target, text);
} finally { await rm(temp, {recursive:true, force:true}); }
