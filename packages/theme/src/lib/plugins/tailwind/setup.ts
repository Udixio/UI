import fs from 'node:fs';
import path from 'node:path';
import { replaceInFileSync } from 'replace-in-file';

const findTailwindCssFile = (
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

export const setup = () => {
  const searchKeyword = '@plugin "@udixio/tailwind"';

  const result = findTailwindCssFile(process.cwd(), searchKeyword);
  if (!result) {
    throw new Error(
      'Tailwind plugin not found. Please use it first. (@plugin "@udixio/tailwind")',
    );
  }

  modifyCssFile(result);
};

const modifyCssFile = (filePath: string) => {
  try {
    // Recherche du motif avec une expression régulière tolérant les espaces ou retours à la ligne
    const searchPattern = /@plugin "@udixio\/tailwind"\s*{\s*}/;
    const replacement = `@plugin "@udixio/tailwind" {\n}\n@import "./udixio.css" layer(theme);`;

    const results = replaceInFileSync({
      files: filePath, // Chemin du fichier à modifier
      from: searchPattern, // Motif à rechercher
      to: replacement, // Nouveau contenu
    });

    // Analyse des résultats
    if (results.length > 0 && results[0].hasChanged) {
      console.log('✅ Fichier modifié avec succès :', results);
    } else {
      console.log(
        '⚠️ Aucun changement appliqué. Voici les raisons possibles :',
      );
      console.log(
        '- Le motif pour remplacer (@plugin "@udixio/tailwind") n\'a pas été trouvé.',
      );
      console.log(
        '- Le contenu attendu est peut-être déjà présent dans le fichier.',
      );
      console.log(
        '- Vérifiez si le fichier existe au bon emplacement :',
        filePath,
      );
    }
  } catch (error) {
    console.error('❌ Erreur lors de la modification du fichier :', error);
  }
};
