import * as fs from 'fs';

import * as console from 'node:console';
import { dirname, join, normalize, resolve } from 'pathe';
import chalk from 'chalk';

const PREFIX = chalk.magenta('[@udixio/tailwind]') + ' ';

// Fonction utilitaire universelle de normalisation des chemins
const normalizePath = async (filePath: string): Promise<string> => {
  const { fileURLToPath } = await import('url');

  try {
    if (filePath.startsWith('file://')) {
      return normalize(fileURLToPath(filePath));
    }
    return normalize(filePath);
  } catch {
    return normalize(filePath);
  }
};

// Wrapper sécurisé pour fs.existsSync
const safeExistsSync = async (filePath: string): Promise<boolean> => {
  return fs.existsSync(await normalizePath(filePath));
};

// Wrapper sécurisé pour fs.readFileSync
const safeReadFileSync = async (
  filePath: string,
  encoding: BufferEncoding = 'utf8',
): Promise<string> => {
  return fs.readFileSync(await normalizePath(filePath), encoding);
};

// Wrapper sécurisé pour fs.writeFileSync
const safeWriteFileSync = async (
  filePath: string,
  data: string,
): Promise<void> => {
  const normalizedPath = await normalizePath(filePath);
  const dirPath = dirname(normalizedPath);

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  fs.writeFileSync(normalizedPath, data);
};

export const createOrUpdateFile = async (
  filePath: string,
  content: string,
): Promise<void> => {
  try {
    const normalizedPath = await normalizePath(filePath);

    if (!(await safeExistsSync(filePath))) {
      await safeWriteFileSync(filePath, content);
      console.log(
        PREFIX +
          chalk.green(`📄 Created`) +
          chalk.gray(` • `) +
          chalk.cyan(normalizedPath),
      );
    } else {
      await replaceFileContent(filePath, /[\s\S]*/, content);
    }
  } catch (error) {
    console.error(
      PREFIX +
        chalk.red(`🚨 Failed to create file`) +
        chalk.gray(` • `) +
        chalk.cyan(filePath),
    );
    console.error(
      chalk.gray(`   `) +
        chalk.red(error instanceof Error ? error.message : error),
    );
  }
};

export const getFileContent = async (
  filePath: string,
  searchPattern?: RegExp | string,
): Promise<string | false | null> => {
  try {
    const normalizedPath = await normalizePath(filePath);

    if (!(await safeExistsSync(filePath))) {
      console.error(
        PREFIX +
          chalk.red(`❌ File not found`) +
          chalk.gray(` • `) +
          chalk.cyan(normalizedPath),
      );
      return null;
    }

    const fileContent = await safeReadFileSync(filePath);

    if (searchPattern) {
      if (typeof searchPattern === 'string') {
        return fileContent.includes(searchPattern) ? searchPattern : false;
      } else {
        const match = fileContent.match(searchPattern);
        return match ? match[0] : false;
      }
    }

    return fileContent;
  } catch (error) {
    console.error(
      PREFIX +
        chalk.red(`🚨 Read failed`) +
        chalk.gray(` • `) +
        chalk.cyan(filePath),
    );
    console.error(
      chalk.gray(`   `) +
        chalk.red(error instanceof Error ? error.message : error),
    );
    return null;
  }
};

export const replaceFileContent = async (
  filePath: string,
  searchPattern: RegExp | string,
  replacement: string,
): Promise<void> => {
  try {
    const { replaceInFileSync } = await import('replace-in-file');

    const normalizedPath = await normalizePath(filePath);

    const results = replaceInFileSync({
      files: normalizedPath,
      from: searchPattern,
      to: replacement,
    });

    if (results.length > 0 && results[0].hasChanged) {
      console.log(
        PREFIX +
          chalk.green(`✏️  Updated`) +
          chalk.gray(` • `) +
          chalk.cyan(normalizedPath),
      );
    } else {
      console.log(
        PREFIX +
          chalk.yellow(`⏭️  Skipped`) +
          chalk.gray(` • `) +
          chalk.cyan(normalizedPath) +
          chalk.gray(` (no changes needed)`),
      );
    }
  } catch (error) {
    console.error(
      PREFIX +
        chalk.red(`🚨 Update failed`) +
        chalk.gray(` • `) +
        chalk.cyan(filePath),
    );
    console.error(
      chalk.gray(`   `) +
        chalk.red(error instanceof Error ? error.message : error),
    );
  }
};

// Cache pour éviter les recherches redondantes lors d'appels parallèles
const projectRootCache = new Map<string, string>();
const tailwindCssFileCache = new Map<string, string>();

export const findTailwindCssFile = async (
  startDir: string,
  searchPattern: RegExp | string,
): Promise<string | never> => {
  const cacheKey = `${startDir}::${searchPattern.toString()}`;
  if (tailwindCssFileCache.has(cacheKey)) {
    return tailwindCssFileCache.get(cacheKey)!;
  }

  const normalizedStartDir = await normalizePath(startDir);
  const stack = [normalizedStartDir];

  while (stack.length > 0) {
    const currentDir = stack.pop()!;

    let files: string[];
    try {
      files = fs.readdirSync(currentDir);
    } catch {
      continue;
    }

    for (const file of files) {
      const filePath = join(currentDir, file);

      let stats: fs.Stats;
      try {
        stats = fs.statSync(filePath);
      } catch {
        continue;
      }

      if (stats.isDirectory()) {
        if (file !== 'node_modules' && !file.startsWith('.')) {
          stack.push(filePath);
        }
      } else if (
        stats.isFile() &&
        (file.endsWith('.css') ||
          file.endsWith('.scss') ||
          file.endsWith('.sass'))
      ) {
        try {
          const content = await safeReadFileSync(filePath);
          const hasMatch =
            typeof searchPattern === 'string'
              ? content.includes(searchPattern)
              : searchPattern.test(content);

          if (hasMatch) {
            console.log(
              PREFIX +
                chalk.blue(`🔎 CSS entry point`) +
                chalk.gray(` • `) +
                chalk.cyan(filePath),
            );
            tailwindCssFileCache.set(cacheKey, filePath);
            return filePath;
          }
        } catch {
          // skip unreadable files
        }
      }
    }
  }

  const errorMsg =
    chalk.red(`❌ No CSS file found containing `) +
    chalk.yellow(`"${searchPattern}"`) +
    chalk.red(` in `) +
    chalk.cyan(`"${normalizedStartDir}"`);

  throw new Error(errorMsg);
};

export async function findProjectRoot(startPath: string): Promise<string> {
  if (projectRootCache.has(startPath)) {
    return projectRootCache.get(startPath)!;
  }

  const normalizedStartPath = await normalizePath(startPath);
  let currentPath = resolve(normalizedStartPath);
  let levels = 0;

  while (!fs.existsSync(join(currentPath, 'package.json'))) {
    const parentPath = dirname(currentPath);
    if (currentPath === parentPath) {
      throw new Error(
        chalk.red('Unable to locate project root (no package.json found)'),
      );
    }
    currentPath = parentPath;
    levels++;

    if (levels > 10) {
      throw new Error(chalk.red('Project root search exceeded maximum depth'));
    }
  }

  projectRootCache.set(startPath, currentPath);
  return currentPath;
}
