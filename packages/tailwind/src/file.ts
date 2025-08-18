import * as fs from 'fs';
import * as path from 'path';
import { replaceInFileSync } from 'replace-in-file';
import * as console from 'node:console';

export const createOrUpdateFile = (filePath: string, content: string): void => {
  try {
    if (!fs.existsSync(filePath)) {
      // Create the folder if necessary.
      const dirPath = path.dirname(filePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // Create the file with the provided content.
      fs.writeFileSync(filePath, content);
      console.log(`✅ File successfully created: ${filePath}`);
    } else {
      console.log(`⚠️ File already exists: ${filePath}`);
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
    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      console.error(`❌ The specified file does not exist: ${filePath}`);
      return null;
    }

    // Lire le contenu du fichier entier
    const fileContent = fs.readFileSync(filePath, 'utf8');

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
    const results = replaceInFileSync({
      files: filePath,
      from: searchPattern,
      to: replacement,
    });

    if (results.length > 0 && results[0].hasChanged) {
      console.log(`✅ Content successfully replaced in the file: ${filePath}`);
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
  console.log('Recherche du fichier contenant le motif...', startDir);

  const stack = [startDir]; // Pile pour éviter une récursion implicite.

  while (stack.length > 0) {
    const currentDir = stack.pop()!; // Récupérer un répertoire de la pile.
    const files = fs.readdirSync(currentDir);

    for (const file of files) {
      const filePath = path.join(currentDir, file);

      let stats: fs.Stats;
      try {
        stats = fs.statSync(filePath);
      } catch (error) {
        console.error(`Erreur lors de l'accès à ${filePath}:`, error);
        continue; // Ignorer toute erreur d'accès.
      }

      // Ignorer le dossier `node_modules` et autres fichiers inutiles.
      if (stats.isDirectory()) {
        if (file !== 'node_modules') stack.push(filePath); // Empiler seulement les dossiers valides.
      } else if (
        stats.isFile() &&
        (file.endsWith('.css') ||
          file.endsWith('.scss') ||
          file.endsWith('.sass'))
      ) {
        try {
          console.log(`Analyse du fichier : ${filePath}`);
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.match(searchPattern)) {
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
    `Impossible de trouver un fichier contenant "${searchPattern}" dans "${startDir}".`,
  );
};

export function findProjectRoot(startPath) {
  let currentPath = startPath;

  // Boucle jusqu'à trouver un package.json ou jusqu'à arriver à la racine du système
  while (!fs.existsSync(path.join(currentPath, 'package.json'))) {
    const parentPath = path.dirname(currentPath);
    if (currentPath === parentPath) {
      throw new Error('Impossible de localiser la racine du projet.');
    }
    currentPath = parentPath;
  }

  return currentPath;
}
