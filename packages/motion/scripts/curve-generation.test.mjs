import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readdir, cp, readFile, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
const root = fileURLToPath(new URL('..', import.meta.url));
function assertDocumentImports(css) {
  const rules = postcss.parse(css).nodes.filter(node => node.type !== 'comment');
  const expected = ['./motion-springs.generated.css', './motion-curves.generated.css'];
  for (const [index, name] of expected.entries()) {
    assert.equal(rules[index]?.type, 'atrule');
    assert.equal(rules[index]?.name, 'import');
    assert.match(rules[index].params, new RegExp(`^['"]${name.replaceAll('.', '\\.')}['"]$`));
  }
  assert.equal(rules.filter(node => node.type === 'atrule' && node.name === 'import').length, 2);
}
test('document imports are active top-level rules before all style rules', async () => {
  const css = await readFile(path.join(root, 'public/motion.css'), 'utf8');
  assertDocumentImports(css);
  const importLine = "@import './motion-curves.generated.css';";
  assert.throws(() => assertDocumentImports(css.replace(importLine, `/* ${importLine} */`)));
  assert.throws(() => assertDocumentImports(css.replace(importLine, '') + `\n${importLine}\n`));
});
test('generators are deterministic, isolated and safe in either order or concurrently', async t => {
  const tmp = await mkdtemp(path.join(tmpdir(), 'curve-generation-'));
  try {
    for (const dir of ['src','scripts','public']) await cp(path.join(root,dir), path.join(tmp,dir), {recursive:true});
    await cp(path.join(root,'motion-manifest.json'), path.join(tmp,'motion-manifest.json'));
    await symlink(path.join(root,'../../node_modules'), path.join(tmp,'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
    const scratch = path.join(tmp, 'scratch'); await mkdir(scratch);
    const env = {...process.env, TMPDIR: scratch};
    const run = (name, ...args) => spawnSync(process.execPath, [path.join(tmp,'scripts',name), ...args], {encoding:'utf8', env});
    const read = name => readFile(path.join(tmp,name),'utf8');
    const cssFiles = ['public/motion.css', 'public/motion-curves.generated.css', 'public/motion-springs.generated.css'];
    const initial = await Promise.all(cssFiles.map(read));
    assertDocumentImports(initial[0]);
    const sourcePath = path.join(tmp,'scripts/curve-source.json');
    const source = JSON.parse(await readFile(sourcePath,'utf8'));
    source.duration.short1 = 51;
    await writeFile(sourcePath, JSON.stringify(source));
    const springPath = path.join(tmp,'scripts/spring-source.json');
    const spring = JSON.parse(await readFile(springPath,'utf8')); spring.effects[0][2] = 151;
    await writeFile(springPath, JSON.stringify(spring));
    assert.equal(run('generate-curves.mjs','--check').status, 1);
    assert.equal(run('generate-springs.mjs','--check').status, 1);
    for (const name of ['generate-curves.mjs','generate-springs.mjs']) assert.equal(run(name).status, 0);
    const expected = await Promise.all(cssFiles.map(read));
    assert.equal(expected[0], initial[0]);
    assert.match(expected[1], /--udx-motion-duration-short1: 51ms/);
    assert.notEqual(expected[2], initial[2]);
    for (let i = 1; i < cssFiles.length; i++) await writeFile(path.join(tmp,cssFiles[i]), initial[i]);
    for (const name of ['generate-springs.mjs','generate-curves.mjs']) assert.equal(run(name).status, 0);
    assert.deepEqual(await Promise.all(cssFiles.map(read)), expected);
    const concurrent = name => new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [path.join(tmp,'scripts',name)], {stdio:'ignore', env});
      child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${name} exited ${code}`)));
    });
    for (let i = 0; i < 4; i++) {
      for (let j = 1; j < cssFiles.length; j++) await writeFile(path.join(tmp,cssFiles[j]), initial[j]);
      await Promise.all([concurrent('generate-curves.mjs'), concurrent('generate-springs.mjs')]);
      assert.deepEqual(await Promise.all(cssFiles.map(read)), expected);
      assert.equal(run('generate-curves.mjs','--check').status, 0);
      assert.equal(run('generate-springs.mjs','--check').status, 0);
    }
    source.duration.renamed = source.duration.short1; delete source.duration.short1;
    await writeFile(sourcePath, JSON.stringify(source));
    assert.equal(run('generate-curves.mjs').status, 0);
    assert.equal(run('generate-motion-manifest.mjs','--check').status, 1);
    assert.equal(run('generate-motion-manifest.mjs').status, 0);
    assert.match(await read('motion-manifest.json'), /duration\.renamed/);
    assert.equal(run('generate-motion-manifest.mjs','--check').status, 0);
    const validManifest = await readFile(path.join(root,'src/manifest.ts'),'utf8');
    for (const expression of ["import('./curve-data.generated.js')", "import('external')", "import('../outside.js')", "import(name)", "require('external')"]) {
      await writeFile(path.join(tmp,'src/manifest.ts'), validManifest + '\n' + expression + ';\n');
      assert.notEqual(run('generate-motion-manifest.mjs').status, 0, expression);
    }
    await writeFile(path.join(tmp,'src/manifest.ts'), validManifest + "\nimport './missing.js';\n");
    assert.notEqual(run('generate-motion-manifest.mjs').status, 0);
    await writeFile(path.join(tmp,'src/manifest.ts'), validManifest + "\nimport 'external';\n");
    assert.notEqual(run('generate-motion-manifest.mjs').status, 0);
    const outside = path.join(tmp,'outside.ts'); await writeFile(outside,'export const value = 1;');
    await t.test('rejects a dependency symlink escaping src', async child => {
      try { await symlink(outside, path.join(tmp,'src/escape.ts')); }
      catch (error) {
        if (process.platform === 'win32' && (error.code === 'EPERM' || error.code === 'EACCES')) {
          child.skip('Windows account cannot create file symlinks'); return;
        }
        throw error;
      }
      await writeFile(path.join(tmp,'src/manifest.ts'), validManifest + "\nimport './escape.js';\n");
      assert.notEqual(run('generate-motion-manifest.mjs').status, 0);
    });
    for (const easing of ['cubic-bezier(1)', 'cubic-bezier(2, 0, 0, 1)', 'cubic-bezier(0, 0, -1, 1)']) {
      source.easing.standard = easing; await writeFile(sourcePath, JSON.stringify(source));
      const before = await Promise.all(cssFiles.map(read));
      assert.notEqual(run('generate-curves.mjs').status, 0, easing);
      assert.deepEqual(await Promise.all(cssFiles.map(read)), before);
    }
    assert.deepEqual(await readdir(scratch), []);
  } finally { await rm(tmp,{recursive:true,force:true}); }
});
