import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WEIGHTS = ['100', '200', '300', '400', '500', '600', '700'] as const;
const STYLES = ['outlined', 'rounded', 'sharp'] as const;

const STYLE_MAP: Record<string, string> = {
  outlined: 'Outlined',
  rounded: 'Rounded',
  sharp: 'Sharp',
};

function toPascalCase(name: string): string {
  return name
    .split(/[-_]/)
    .map((part) => {
      if (/^\d+/.test(part)) {
        return part;
      }
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join('');
}

function getIconName(filename: string): string {
  return filename.replace(/\.svg$/, '').replace(/-fill$/, '');
}

function generateExportName(
  iconName: string,
  style: string,
  weight: string
): string {
  const pascalName = toPascalCase(iconName);
  const styleName = STYLE_MAP[style];
  return `i${pascalName}${styleName}${weight}`;
}

function main() {
  const pkgDir = path.resolve(__dirname, '..');
  const srcDir = path.join(pkgDir, 'src');
  const nodeModulesDir = path.join(pkgDir, 'node_modules', '@material-symbols');

  // Clean src directory
  if (fs.existsSync(srcDir)) {
    fs.rmSync(srcDir, { recursive: true });
  }
  fs.mkdirSync(srcDir, { recursive: true });
  fs.mkdirSync(path.join(srcDir, 'filled'), { recursive: true });

  const nonFilledBarrel: string[] = [];
  const filledBarrel: string[] = [];

  const seenNonFilled = new Set<string>();
  const seenFilled = new Set<string>();

  let fileCount = 0;

  for (const weight of WEIGHTS) {
    const svgPkgDir = path.join(nodeModulesDir, `svg-${weight}`);

    if (!fs.existsSync(svgPkgDir)) {
      console.warn(`Package not found: @material-symbols/svg-${weight}`);
      continue;
    }

    for (const style of STYLES) {
      const styleDir = path.join(svgPkgDir, style);

      if (!fs.existsSync(styleDir)) {
        console.warn(`Style directory not found: ${styleDir}`);
        continue;
      }

      const files = fs.readdirSync(styleDir).filter((f) => f.endsWith('.svg'));

      for (const file of files) {
        const isFilled = file.endsWith('-fill.svg');
        const iconName = getIconName(file);
        const exportName = generateExportName(iconName, style, weight);

        // Create directory: src/<style>/<iconName>/
        const iconDir = path.join(srcDir, style, iconName);
        fs.mkdirSync(iconDir, { recursive: true });

        // Read SVG
        const svgContent = fs
          .readFileSync(path.join(styleDir, file), 'utf-8')
          .trim()
          .replace(/\n/g, '');
        const escapedSvg = svgContent.replace(/'/g, "\\'");

        // Determine file path
        const iconFileName = isFilled
          ? `${weight}.filled.ts`
          : `${weight}.ts`;
        const iconFilePath = path.join(iconDir, iconFileName);

        // Write individual icon file
        const fileContent = `const ${exportName} = '${escapedSvg}';\nexport default ${exportName};\n`;
        fs.writeFileSync(iconFilePath, fileContent);
        fileCount++;

        // Add barrel export
        const relativePath = `./${style}/${iconName}/${weight}`;
        if (isFilled) {
          if (!seenFilled.has(exportName)) {
            seenFilled.add(exportName);
            filledBarrel.push(
              `export { default as ${exportName} } from '../${style}/${iconName}/${weight}.filled';`
            );
          }
        } else {
          if (!seenNonFilled.has(exportName)) {
            seenNonFilled.add(exportName);
            nonFilledBarrel.push(
              `export { default as ${exportName} } from '${relativePath}';`
            );
          }
        }
      }
    }
  }

  // Write barrel index files
  fs.writeFileSync(
    path.join(srcDir, 'index.ts'),
    nonFilledBarrel.join('\n') + '\n'
  );
  fs.writeFileSync(
    path.join(srcDir, 'filled', 'index.ts'),
    filledBarrel.join('\n') + '\n'
  );

  console.log(`Generated ${fileCount} individual icon files`);
  console.log(
    `Barrel: ${nonFilledBarrel.length} non-filled, ${filledBarrel.length} filled`
  );
}

main();
