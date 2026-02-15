import * as fs from 'fs';
import * as path from 'path';

const VALID_STYLES = ['outlined', 'rounded', 'sharp'] as const;
type Style = (typeof VALID_STYLES)[number];

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

function generateExportName(iconName: string): string {
  const pascalName = toPascalCase(iconName);
  return `i${pascalName}`;
}

function main() {
  const style = process.argv[2] as Style;
  const weight = process.argv[3];

  if (
    !style ||
    !VALID_STYLES.includes(style) ||
    !weight ||
    !/^[1-7]00$/.test(weight)
  ) {
    console.error('Usage: generate-icons.ts <style> <weight>');
    console.error('  style:  outlined | rounded | sharp');
    console.error('  weight: 100 | 200 | 300 | 400 | 500 | 600 | 700');
    process.exit(1);
  }

  const pkgDir = path.resolve(process.cwd());
  const srcDir = path.join(pkgDir, 'src');
  const nodeModulesDir = path.join(pkgDir, 'node_modules', '@material-symbols');
  const svgPkgDir = path.join(nodeModulesDir, `svg-${weight}`);

  if (!fs.existsSync(svgPkgDir)) {
    console.error(`Package not found: @material-symbols/svg-${weight}`);
    console.error(`Run pnpm install first.`);
    process.exit(1);
  }

  const styleDir = path.join(svgPkgDir, style);
  if (!fs.existsSync(styleDir)) {
    console.error(`Style directory not found: ${styleDir}`);
    process.exit(1);
  }

  // Clean src directory
  if (fs.existsSync(srcDir)) {
    fs.rmSync(srcDir, { recursive: true });
  }
  fs.mkdirSync(srcDir, { recursive: true });

  let fileCount = 0;
  let filledCount = 0;
  let nonFilledCount = 0;

  const files = fs.readdirSync(styleDir).filter((f) => f.endsWith('.svg'));

  for (const file of files) {
    const isFilled = file.endsWith('-fill.svg');
    const iconName = getIconName(file);
    const baseName = generateExportName(iconName);
    const exportName = isFilled ? `${baseName}Filled` : baseName;

    // Read SVG
    const svgContent = fs
      .readFileSync(path.join(styleDir, file), 'utf-8')
      .trim()
      .replace(/\n/g, '');
    const escapedSvg = svgContent.replace(/'/g, "\\'");

    // File path: src/<iconName>.ts or src/<iconName>.filled.ts
    const iconFileName = isFilled
      ? `${iconName}.filled.ts`
      : `${iconName}.ts`;
    const iconFilePath = path.join(srcDir, iconFileName);

    // Each file exports a named export matching the icon name
    const fileContent = `export const ${exportName} = '${escapedSvg}';\n`;
    fs.writeFileSync(iconFilePath, fileContent);
    fileCount++;
    if (isFilled) filledCount++;
    else nonFilledCount++;
  }

  console.log(
    `@udixio/icons-${style}-${weight}: ${fileCount} files, ${nonFilledCount} non-filled, ${filledCount} filled`
  );
}

main();
