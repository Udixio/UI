import * as fs from 'fs';
import { replaceInFileSync } from 'replace-in-file';
import * as console from 'node:console';
import { dirname, join, normalize, resolve } from 'pathe';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// Fonction utilitaire universelle de normalisation des chemins
const normalizePath = (filePath: string): string => {
  try {
    if (filePath.startsWith('file://')) {
      return normalize(fileURLToPath(filePath));
    }
    return normalize(filePath);
  } catch (error) {
    console.warn(
      chalk.yellow(
        `⚠️  Could not process path ${filePath}, treating as regular path`,
      ),
    );
    return normalize(filePath);
  }
};

// Wrapper sécurisé pour fs.existsSync
const safeExistsSync = (filePath: string): boolean => {
  return fs.existsSync(normalizePath(filePath));
};

// Wrapper sécurisé pour fs.readFileSync
const safeReadFileSync = (
  filePath: string,
  encoding: BufferEncoding = 'utf8',
): string => {
  return fs.readFileSync(normalizePath(filePath), encoding);
};

// Wrapper sécurisé pour fs.writeFileSync
const safeWriteFileSync = (filePath: string, data: string): void => {
  const normalizedPath = normalizePath(filePath);
  const dirPath = dirname(normalizedPath);

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  fs.writeFileSync(normalizedPath, data);
};

export const createOrUpdateFile = (filePath: string, content: string): void => {
  try {
    const normalizedPath = normalizePath(filePath);

    if (!safeExistsSync(filePath)) {
      safeWriteFileSync(filePath, content);
      console.log(
        chalk.green(`📄 Created`) +
          chalk.gray(` • `) +
          chalk.cyan(normalizedPath),
      );
    } else {
      console.log(
        chalk.blue(`📝 Exists`) +
          chalk.gray(` • `) +
          chalk.cyan(normalizedPath),
      );
      replaceFileContent(filePath, /[\s\S]*/, content);
    }
  } catch (error) {
    console.error(
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

export const getFileContent = (
  filePath: string,
  searchPattern?: RegExp | string,
): string | false | null => {
  try {
    const normalizedPath = normalizePath(filePath);

    // Vérifier si le fichier existe
    if (!safeExistsSync(filePath)) {
      console.error(
        chalk.red(`❌ File not found`) +
          chalk.gray(` • `) +
          chalk.cyan(normalizedPath),
      );
      return null;
    }

    // Lire le contenu du fichier entier
    const fileContent = safeReadFileSync(filePath);

    // Si un motif est fourni, chercher le texte correspondant
    if (searchPattern) {
      if (typeof searchPattern === 'string') {
        const found = fileContent.includes(searchPattern)
          ? searchPattern
          : false;
        if (found) {
          console.log(
            chalk.green(`🔍 Found`) +
              chalk.gray(` • `) +
              chalk.yellow(`"${searchPattern}"`),
          );
        } else {
          console.log(
            chalk.yellow(`🔍 Missing`) +
              chalk.gray(` • `) +
              chalk.yellow(`"${searchPattern}"`),
          );
        }
        return found;
      } else {
        const match = fileContent.match(searchPattern);
        if (match) {
          console.log(
            chalk.green(`🎯 Match`) +
              chalk.gray(` • `) +
              chalk.yellow(`"${match[0]}"`),
          );
          return match[0];
        } else {
          console.log(
            chalk.yellow(`🎯 No match`) +
              chalk.gray(` • `) +
              chalk.magenta(searchPattern.toString()),
          );
          return false;
        }
      }
    }

    console.log(
      chalk.blue(`📖 Read`) + chalk.gray(` • `) + chalk.cyan(normalizedPath),
    );
    return fileContent;
  } catch (error) {
    console.error(
      chalk.red(`🚨 Read failed`) + chalk.gray(` • `) + chalk.cyan(filePath),
    );
    console.error(
      chalk.gray(`   `) +
        chalk.red(error instanceof Error ? error.message : error),
    );
    return null;
  }
};

export const replaceFileContent = (
  filePath: string,
  searchPattern: RegExp | string,
  replacement: string,
): void => {
  try {
    const normalizedPath = normalizePath(filePath);

    const results = replaceInFileSync({
      files: normalizedPath,
      from: searchPattern,
      to: replacement,
    });

    if (results.length > 0 && results[0].hasChanged) {
      console.log(
        chalk.green(`✏️  Updated`) +
          chalk.gray(` • `) +
          chalk.cyan(normalizedPath),
      );
    } else {
      console.log(
        chalk.yellow(`⏭️  Skipped`) +
          chalk.gray(` • `) +
          chalk.cyan(normalizedPath) +
          chalk.gray(` (no changes needed)`),
      );
    }
  } catch (error) {
    console.error(
      chalk.red(`🚨 Update failed`) + chalk.gray(` • `) + chalk.cyan(filePath),
    );
    console.error(
      chalk.gray(`   `) +
        chalk.red(error instanceof Error ? error.message : error),
    );
  }
};

export const findTailwindCssFile = (
  startDir: string,
  searchPattern: RegExp | string,
): string | never => {
  const normalizedStartDir = normalizePath(startDir);
  console.log(chalk.blue(`🔎 Searching for CSS file...`));
  console.log(
    chalk.gray(`   Starting from: `) + chalk.cyan(normalizedStartDir),
  );

  const stack = [normalizedStartDir];
  let filesScanned = 0;

  while (stack.length > 0) {
    const currentDir = stack.pop()!;

    let files: string[];
    try {
      files = fs.readdirSync(currentDir);
    } catch (error) {
      console.error(
        chalk.gray(`   `) +
          chalk.red(`❌ Cannot read directory: `) +
          chalk.cyan(currentDir),
      );
      continue;
    }

    for (const file of files) {
      const filePath = join(currentDir, file);

      let stats: fs.Stats;
      try {
        stats = fs.statSync(filePath);
      } catch (error) {
        console.error(
          chalk.gray(`   `) +
            chalk.red(`❌ Cannot access: `) +
            chalk.cyan(filePath),
        );
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
          filesScanned++;
          process.stdout.write(
            chalk.gray(`   📂 Scanning: `) + chalk.yellow(file) + `\r`,
          );

          const content = safeReadFileSync(filePath);

          const hasMatch =
            typeof searchPattern === 'string'
              ? content.includes(searchPattern)
              : searchPattern.test(content);

          if (hasMatch) {
            console.log(chalk.green(`\n🎯 Found target file!`));
            console.log(chalk.gray(`   📍 Location: `) + chalk.cyan(filePath));
            return filePath;
          }
        } catch (readError) {
          console.error(
            chalk.gray(`\n   `) +
              chalk.red(`❌ Cannot read: `) +
              chalk.cyan(filePath),
          );
        }
      }
    }
  }

  console.log(
    chalk.blue(`\n📊 Scanned `) +
      chalk.white.bold(filesScanned.toString()) +
      chalk.blue(` CSS files`),
  );

  const errorMsg =
    chalk.red(`❌ No file found containing `) +
    chalk.yellow(`"${searchPattern}"`) +
    chalk.red(` in `) +
    chalk.cyan(`"${normalizedStartDir}"`);

  throw new Error(errorMsg);
};

export function findProjectRoot(startPath: string): string {
  const normalizedStartPath = normalizePath(startPath);
  let currentPath = resolve(normalizedStartPath);
  let levels = 0;

  console.log(chalk.blue(`🏠 Finding project root...`));
  console.log(
    chalk.gray(`   Starting from: `) + chalk.cyan(normalizedStartPath),
  );

  while (!fs.existsSync(join(currentPath, 'package.json'))) {
    const parentPath = dirname(currentPath);
    if (currentPath === parentPath) {
      console.error(
        chalk.red(`❌ Project root not found after checking `) +
          chalk.white.bold(levels.toString()) +
          chalk.red(` levels`),
      );
      throw new Error(
        chalk.red('Unable to locate project root (no package.json found)'),
      );
    }
    currentPath = parentPath;
    levels++;

    if (levels > 10) {
      console.error(
        chalk.red(`❌ Stopped after `) +
          chalk.white.bold(levels.toString()) +
          chalk.red(` levels (too deep)`),
      );
      throw new Error(chalk.red('Project root search exceeded maximum depth'));
    }
  }

  console.log(chalk.green(`📁 Project root: `) + chalk.cyan(currentPath));
  return currentPath;
}
