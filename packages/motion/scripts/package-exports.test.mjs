import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { rollup } from 'rollup';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const root = new URL('../', import.meta.url);
const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));

test('file URL paths preserve spaces for Rollup', () => {
  const location = join(process.cwd(), 'directory with spaces', 'index.js');
  assert.equal(fileURLToPath(pathToFileURL(location)), location);
});

test('manifest has published and development entry points', () => {
  assert.deepEqual(pkg.exports['./manifest'], {
    development: './src/manifest.ts', types: './dist/manifest.d.ts',
    import: './dist/manifest.js', require: './dist/manifest.cjs', default: './dist/manifest.js',
  });
  assert.deepEqual(pkg.publishConfig.exports['./manifest'], {
    types: './dist/manifest.d.ts', import: './dist/manifest.js',
    require: './dist/manifest.cjs', default: './dist/manifest.js',
  });
});

test('presets entry point is public in both export maps', () => {
  assert.deepEqual(pkg.exports['./presets'], {
    development: './src/presets.ts', types: './dist/presets.d.ts',
    import: './dist/presets.js', require: './dist/presets.cjs', default: './dist/presets.js',
  });
  assert.deepEqual(pkg.publishConfig.exports['./presets'], {
    types: './dist/presets.d.ts', import: './dist/presets.js',
    require: './dist/presets.cjs', default: './dist/presets.js',
  });
});

test('layout entry point is public in both export maps', () => {
  assert.deepEqual(pkg.exports['./layout'], {
    development: './src/layout.ts', types: './dist/layout.d.ts',
    import: './dist/layout.js', require: './dist/layout.cjs', default: './dist/layout.js',
  });
  assert.deepEqual(pkg.publishConfig.exports['./layout'], {
    types: './dist/layout.d.ts', import: './dist/layout.js',
    require: './dist/layout.cjs', default: './dist/layout.js',
  });
});

test('value and sequence entry points are public in both export maps', () => {
  for (const name of ['value', 'sequence']) {
    assert.deepEqual(pkg.exports[`./${name}`], {
      development: `./src/${name}-entry.ts`, types: `./dist/${name}.d.ts`,
      import: `./dist/${name}.js`, require: `./dist/${name}.cjs`, default: `./dist/${name}.js`,
    });
    assert.deepEqual(pkg.publishConfig.exports[`./${name}`], {
      types: `./dist/${name}.d.ts`, import: `./dist/${name}.js`,
      require: `./dist/${name}.cjs`, default: `./dist/${name}.js`,
    });
  }
});

test('the main entry loads the layout engine with a dynamic import only', async () => {
  const index = await readFile(new URL('dist/index.js', root), 'utf8');
  assert.match(index, /import\(["']\.\/layout\.js["']\)/);
  assert.doesNotMatch(index, /^import\b[^;]*["']\.\/layout\.js["']/m);
});

/** The source of each file a built entry loads at once: its static imports, followed through the chunks it imports. */
async function staticClosure(entry) {
  const files = new Map();
  const queue = [new URL(entry, root)];
  while (queue.length > 0) {
    const file = queue.shift();
    if (files.has(file.href)) continue;
    const code = await readFile(file, 'utf8');
    files.set(file.href, code);
    for (const match of code.matchAll(/^import\s[^;]*?["'](\.[^"']+)["']/gm)) queue.push(new URL(match[1], file));
    for (const match of code.matchAll(/(?:^|[=,;])\s*require\(["'](\.[^"']+)["']\)/gm)) queue.push(new URL(match[1], file));
  }
  return [...files.values()];
}

test('the main entry reaches values and sequences only through dynamic imports, and holds neither their code', async () => {
  // The loaders may sit in a chunk the main entry imports: the check follows the static imports from the entry.
  for (const [entry, extension] of [['dist/index.js', 'js'], ['dist/index.cjs', 'cjs']]) {
    const sources = await staticClosure(entry);
    for (const name of ['value', 'sequence']) {
      const dynamicImport = extension === 'js'
        ? new RegExp(`import\\(["']\\./${name}\\.js["']\\)`)
        : new RegExp(`=>\\s*require\\(["']\\./${name}\\.cjs["']\\)`);
      const staticImport = extension === 'js'
        ? new RegExp(`^import\\s[^;]*["']\\./${name}\\.js["']`, 'm')
        : new RegExp(`(?:^|[=,;])\\s*require\\(["']\\./${name}\\.cjs["']\\)`, 'm');
      assert.ok(sources.some(code => dynamicImport.test(code)), `${entry} does not load ./${name} dynamically`);
      for (const code of sources) assert.doesNotMatch(code, staticImport);
    }
    for (const code of sources) assert.doesNotMatch(code, /Invalid value spec|Invalid sequence spec|udx-motion-value-/);
  }
});

test('a named runtime key import does not include the manifest', async () => {
  const bundle = await rollup({
    input: 'runtime-key-test',
    plugins: [{ name: 'test-entry', resolveId(id) { return id === 'runtime-key-test' ? id : null; }, load(id) { return id === 'runtime-key-test' ? `export { RUNTIME_KEY } from ${JSON.stringify(fileURLToPath(new URL('dist/index.js', root)))};` : null; } }],
    treeshake: true,
  });
  const { output } = await bundle.generate({ format: 'es' });
  await bundle.close();
  const code = output[0].code;
  assert.match(code, /udixio\.motion@1/);
  assert.doesNotMatch(code, /Motion manifest|validateMotionDocument|motionManifest/);
});

test('public spring resolver import excludes animation providers and engines', async () => {
  const bundleFor = async (name) => {
    const bundle = await rollup({
      input: 'spring-entry',
      plugins: [{
        name: 'public-package-entry',
        resolveId(id) {
          if (id === 'spring-entry') return id;
          if (id === '@udixio/motion') return fileURLToPath(new URL(pkg.exports['.'].import, root));
          return null;
        },
        load(id) { return id === 'spring-entry' ? `export { ${name} } from '@udixio/motion';` : null; },
      }],
      treeshake: true,
    });
    const { output } = await bundle.generate({ format: 'es' });
    await bundle.close();
    return output[0];
  };
  const resolver = await bundleFor('resolveSpring');
  const control = await bundleFor('defineTokens');
  const inputs = Object.keys(resolver.modules);
  assert.match(resolver.code, /resolveSpring/);
  assert.ok(control.code.length > 0);
  assert.ok(resolver.code.length > control.code.length);
  assert.ok(inputs.every((id) => !/providers|animejs/.test(id)), `unexpected inputs: ${inputs.join(', ')}`);
});

test('public curve resolver import excludes animation providers and engines', async () => {
  const bundle = await rollup({
    input: 'curve-entry',
    plugins: [{
      name: 'public-package-entry',
      resolveId(id) {
        if (id === 'curve-entry') return id;
        if (id === '@udixio/motion') return fileURLToPath(new URL(pkg.exports['.'].import, root));
        return null;
      },
      load(id) { return id === 'curve-entry' ? "export { resolveCurve } from '@udixio/motion';" : null; },
    }],
    treeshake: true,
  });
  try {
    const { output } = await bundle.generate({ format: 'es' });
    const inputs = Object.keys(output[0].modules);
    assert.match(output[0].code, /resolveCurve/);
    assert.ok(inputs.every(id => !/providers|animejs/.test(id)), `unexpected inputs: ${inputs.join(', ')}`);
    assert.doesNotMatch(output[0].code, /animejs|MotionProvider/);
  } finally { await bundle.close(); }
});

test('built ESM and CommonJS package entries resolve curves without browser globals', async () => {
  assert.equal(typeof globalThis.window, 'undefined');
  assert.equal(typeof globalThis.document, 'undefined');
  assert.equal(typeof globalThis.matchMedia, 'undefined');
  const esm = await import('@udixio/motion');
  const cjs = createRequire(import.meta.url)('@udixio/motion');
  for (const entry of [esm, cjs]) {
    assert.deepEqual(entry.resolveCurve({ duration: 'duration.medium2', easing: 'easing.standard' }), {
      duration: 300, easing: 'cubic-bezier(0.2, 0, 0, 1)',
    });
    assert.throws(() => entry.resolveCurve({ duration: 'duration.constructor', easing: 'easing.linear' }));
  }
});


test('built CSS is the static document stylesheet and the package loads without a DOM', async () => {
  assert.equal(await readFile(new URL('dist/motion.css', root), 'utf8'), await readFile(new URL('public/motion.css', root), 'utf8'));
  for (const name of ['motion-curves.generated.css', 'motion-springs.generated.css']) assert.equal(await readFile(new URL(`dist/${name}`, root), 'utf8'), await readFile(new URL(`public/${name}`, root), 'utf8'));
  const entry = await import(new URL('dist/index.js', root));
  assert.equal(typeof entry.defineTokens, 'function');
  assert.equal(typeof globalThis.document, 'undefined');
});

test('motion CSS size budget accepts the artifact and rejects an oversized one', async () => {
  const { mkdtemp, mkdir, writeFile, symlink, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { spawnSync } = await import('node:child_process');
  const { randomBytes } = await import('node:crypto');
  const dir = await mkdtemp(join(tmpdir(), 'motion-size-'));
  try {
    const config = JSON.parse(await readFile(new URL('.size-limit.json', root), 'utf8'));
    const check = config.find(item => item.name === 'motion-css');
    assert.ok(check);
    await writeFile(join(dir, '.size-limit.json'), JSON.stringify([check]));
    await writeFile(join(dir, 'package.json'), JSON.stringify({ devDependencies: { '@size-limit/preset-small-lib': '*' } }));
    await symlink(fileURLToPath(new URL('../../node_modules', root)), join(dir, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
    await mkdir(join(dir, 'dist'));
    const artifact = await readFile(new URL('dist/motion.css', root), 'utf8');
    const path = join(dir, 'dist/motion.css');
    const cli = fileURLToPath(new URL('../../node_modules/size-limit/bin.js', root));
    const run = () => spawnSync(process.execPath, [cli], { cwd: dir, encoding: 'utf8' });
    for (const name of ['motion-curves.generated.css', 'motion-springs.generated.css']) await writeFile(join(dir, 'dist', name), await readFile(new URL(`dist/${name}`, root)));
    await writeFile(path, artifact);
    let result = run();
    assert.equal(result.status, 0, result.stdout + result.stderr);
    // Verify that the budget includes each imported fragment independently.
    for (const name of ['motion-curves.generated.css', 'motion-springs.generated.css']) {
      const file = join(dir, 'dist', name);
      const original = await readFile(file, 'utf8');
      await writeFile(file, `${original}\n:root { --oversized: ${randomBytes(4000).toString('hex')}; }\n`);
      result = run();
      assert.equal(result.status, 1, `${name}: ${result.stdout}${result.stderr}`);
      assert.match(result.stdout + result.stderr, /exceeded/i);
      await writeFile(file, original);
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('policy entry is public in both export maps and internal-policy is gone', () => {
  for (const exportsMap of [pkg.exports, pkg.publishConfig.exports]) {
    assert.equal(exportsMap['./internal-policy'], undefined);
  }
  assert.deepEqual(pkg.exports['./policy'], {
    development: './src/policy.ts', types: './dist/policy.d.ts',
    import: './dist/policy.js', require: './dist/policy.cjs', default: './dist/policy.js',
  });
  assert.deepEqual(pkg.publishConfig.exports['./policy'], {
    types: './dist/policy.d.ts', import: './dist/policy.js',
    require: './dist/policy.cjs', default: './dist/policy.js',
  });
});

test('policy resolves from built ESM and CommonJS without DOM globals', async () => {
  const esm = await import('@udixio/motion/policy');
  const cjs = createRequire(import.meta.url)('@udixio/motion/policy');
  for (const entry of [esm, cjs]) {
    assert.equal(typeof entry.motionPolicy.retain, 'function');
    entry.motionPolicy.retain();
    assert.equal(entry.motionPolicy.reduced, false);
    entry.motionPolicy.release();
  }
});

test('package index exports the runtime factories from built ESM and CommonJS', async () => {
  const esm = await import('@udixio/motion');
  const cjs = createRequire(import.meta.url)('@udixio/motion');
  for (const entry of [esm, cjs]) {
    assert.equal(typeof entry.getMotionRuntime, 'function');
    assert.equal(typeof entry.retainMotionRuntime, 'function');
  }
});

test('gesture entry point is public in both export maps', () => {
  assert.deepEqual(pkg.exports['./gesture'], {
    development: './src/gesture-entry.ts', types: './dist/gesture.d.ts',
    import: './dist/gesture.js', require: './dist/gesture.cjs', default: './dist/gesture.js',
  });
  assert.deepEqual(pkg.publishConfig.exports['./gesture'], {
    types: './dist/gesture.d.ts', import: './dist/gesture.js',
    require: './dist/gesture.cjs', default: './dist/gesture.js',
  });
});

test('the main entry reaches gestures only through a dynamic import, and holds none of their code', async () => {
  for (const [entry, extension] of [['dist/index.js', 'js'], ['dist/index.cjs', 'cjs']]) {
    const sources = await staticClosure(entry);
    const dynamicImport = extension === 'js'
      ? /import\(["']\.\/gesture\.js["']\)/
      : /=>\s*require\(["']\.\/gesture\.cjs["']\)/;
    const staticImport = extension === 'js'
      ? /^import\s[^;]*["']\.\/gesture\.js["']/m
      : /(?:^|[=,;])\s*require\(["']\.\/gesture\.cjs["']\)/m;
    assert.ok(sources.some(code => dynamicImport.test(code)), `${entry} does not load ./gesture dynamically`);
    for (const code of sources) {
      assert.doesNotMatch(code, staticImport);
      assert.doesNotMatch(code, /Invalid gesture spec|data-udx-motion-live/);
    }
  }
});
