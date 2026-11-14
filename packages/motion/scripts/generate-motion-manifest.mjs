import { mkdtemp, readFile, writeFile, mkdir, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const src = path.resolve(fileURLToPath(new URL('../src/', import.meta.url)));
const realSrc = await realpath(src);
const target = new URL('../motion-manifest.json', import.meta.url);
const temp = await mkdtemp(path.join(tmpdir(), 'motion-manifest-'));
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
  const { motionManifest } = await import(pathToFileURL(path.join(temp, 'manifest.js')).href);
  const output = `${JSON.stringify(motionManifest, null, 2)}\n`;
  if (process.argv.includes('--check')) {
    if (await readFile(target, 'utf8').catch(() => '') !== output) { console.error('Motion manifest is stale; run node scripts/generate-motion-manifest.mjs'); process.exitCode = 1; }
  } else await writeFile(target, output);
} finally { await rm(temp, {recursive:true, force:true}); }
