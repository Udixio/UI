// docgen.js
import { withDefaultConfig } from 'react-docgen-typescript';
import path from 'path';
import { glob } from 'glob';
import { mkdir, writeFile } from 'fs/promises';

const parser = withDefaultConfig();

const getComponentName = (filepath) => {
  const filename = path.basename(filepath, '.tsx');
  return filename.charAt(0).toLowerCase() + filename.slice(1);
};

// Fonction pour normaliser les chemins et les rendre relatifs
const normalizePaths = (docs, projectRoot) => {
  const normalizeObj = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(normalizeObj);
    }

    if (obj && typeof obj === 'object') {
      const normalized = {};
      for (const [key, value] of Object.entries(obj)) {
        if (key === 'filePath' || key === 'fileName') {
          if (typeof value === 'string' && path.isAbsolute(value)) {
            // Convertir le chemin absolu en chemin relatif
            normalized[key] = path.relative(projectRoot, value);
          } else {
            normalized[key] = value;
          }
        } else {
          normalized[key] = normalizeObj(value);
        }
      }
      return normalized;
    }

    return obj;
  };

  return normalizeObj(docs);
};

const writeComponentDoc = async (componentName, docs) => {
  const outputDir = path.resolve('./src/data/api');
  await mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${componentName}.json`);

  // Obtenir le répertoire racine du projet
  const projectRoot = process.cwd();

  // Normaliser les chemins dans la documentation
  const normalizedDocs = normalizePaths(docs, projectRoot);

  await writeFile(outputPath, JSON.stringify(normalizedDocs, null, 2));
};

const componentPaths = await glob(
  path.resolve('./node_modules/@udixio/ui-react/src/lib/components/**/*.tsx'),
);

for (const componentPath of componentPaths) {
  console.log(`Processing: ${componentPath}`);
  const docs = parser.parse(componentPath);
  const componentName = getComponentName(componentPath);
  await writeComponentDoc(componentName, docs);
}
