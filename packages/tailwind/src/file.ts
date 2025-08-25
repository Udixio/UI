import * as fs from 'fs';
import { replaceInFileSync } from 'replace-in-file';
import * as console from 'node:console';
import { dirname, join, normalize, resolve } from 'pathe';
import { fileURLToPath } from 'url';

// Fonction utilitaire universelle de normalisation des chemins
const normalizePath = (filePath: string): string => {
  try {
    if (filePath.startsWith('file://')) {
      return normalize(fileURLToPath(filePath));
    }
    return normalize(filePath);
  } catch (error) {
    console.warn(
      `Warning: Could not process path ${filePath}, treating as regular path`,
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
      console.log(`✅ File successfully created: ${normalizedPath}`);
    } else {
      console.log(`⚠️ File already exists: ${normalizedPath}`);
      replaceFileContent(filePath, /[\s\S]*/, content);
    }
  } catch (error) {
    console.error('❌ Error while creating the file:', error);
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
      console.error(`❌ The specified file does not exist: ${normalizedPath}`);
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
        console.log(
          found
            ? `✅ The file contains the specified string: "${searchPattern}"`
            : `⚠️ The file does NOT contain the specified string: "${searchPattern}"`,
        );
        return found;
      } else {
        const match = fileContent.match(searchPattern);
        if (match) {
          console.log(`✅ Found match: "${match[0]}"`);
          return match[0]; // Retourner le texte trouvé
        } else {
          console.log(
            `⚠️ No match found for the pattern: "${searchPattern.toString()}"`,
          );
          return false; // Aucune correspondance trouvée
        }
      }
    }

    // Si aucun motif n'est fourni, retourner tout le contenu
    console.log(`✅ File content successfully retrieved.`);
    return fileContent;
  } catch (error) {
    console.error('❌ An error occurred while processing the file:', error);
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
        `✅ Content successfully replaced in the file: ${normalizedPath}`,
      );
    } else {
      console.log(
        `⚠️ No replacement made. Here are some possible reasons:\n- The pattern ${searchPattern} was not found.\n- The file might already contain the expected content.`,
      );
    }
  } catch (error) {
    console.error('❌ Error while replacing the file content:', error);
  }
};

export const findTailwindCssFile = (
  startDir: string,
  searchPattern: RegExp | string,
): string | never => {
  const normalizedStartDir = normalizePath(startDir);
  console.log('Recherche du fichier contenant le motif...', normalizedStartDir);

  const stack = [normalizedStartDir]; // Pile pour éviter une récursion implicite.

  while (stack.length > 0) {
    const currentDir = stack.pop()!; // Récupérer un répertoire de la pile.

    let files: string[];
    try {
      files = fs.readdirSync(currentDir);
    } catch (error) {
      console.error(
        `Erreur lors de la lecture du répertoire ${currentDir}:`,
        error,
      );
      continue;
    }

    for (const file of files) {
      const filePath = join(currentDir, file);

      let stats: fs.Stats;
      try {
        stats = fs.statSync(filePath);
      } catch (error) {
        console.error(`Erreur lors de l'accès à ${filePath}:`, error);
        continue; // Ignorer toute erreur d'accès.
      }

      // Ignorer le dossier `node_modules` et autres fichiers inutiles.
      if (stats.isDirectory()) {
        if (file !== 'node_modules' && !file.startsWith('.')) {
          stack.push(filePath); // Empiler seulement les dossiers valides.
        }
      } else if (
        stats.isFile() &&
        (file.endsWith('.css') ||
          file.endsWith('.scss') ||
          file.endsWith('.sass'))
      ) {
        try {
          console.log(`Analyse du fichier : ${filePath}`);
          const content = safeReadFileSync(filePath);

          // Gérer les deux types de searchPattern
          const hasMatch =
            typeof searchPattern === 'string'
              ? content.includes(searchPattern)
              : searchPattern.test(content);

          if (hasMatch) {
            console.log('Fichier trouvé :', filePath);
            return filePath; // Retour dès qu'un fichier valide est identifié.
          }
        } catch (readError) {
          console.error(`Erreur lors de la lecture de ${filePath}:`, readError);
        }
      }
    }
  }

  throw new Error(
    `Impossible de trouver un fichier contenant "${searchPattern}" dans "${normalizedStartDir}".`,
  );
};

export function findProjectRoot(startPath: string): string {
  const normalizedStartPath = normalizePath(startPath);
  let currentPath = resolve(normalizedStartPath);

  // Boucle jusqu'à trouver un package.json ou jusqu'à arriver à la racine du système
  while (!fs.existsSync(join(currentPath, 'package.json'))) {
    const parentPath = dirname(currentPath);
    if (currentPath === parentPath) {
      throw new Error('Impossible de localiser la racine du projet.');
    }
    currentPath = parentPath;
  }

  return currentPath;
}
