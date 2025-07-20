import * as fs from 'fs';
import * as path from 'path';
import { replaceInFileSync } from 'replace-in-file';

export const createFile = (filePath: string, content: string): void => {
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
    }
  } catch (error) {
    console.error('❌ Error while creating the file:', error);
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
  searchPattern: string,
): string | null => {
  const files = fs.readdirSync(startDir);

  for (const file of files) {
    const filePath = path.join(startDir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      // Appeler récursivement si c'est un dossier
      const result = findTailwindCssFile(filePath, searchPattern);
      if (result) return result;
    } else if (file.endsWith('.css')) {
      // Lire chaque fichier .css
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes(searchPattern)) {
        console.log('Fichier trouvé :', filePath);
        return filePath;
      }
    }
  }

  return null;
};
