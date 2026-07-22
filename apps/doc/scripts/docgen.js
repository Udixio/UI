import { parseTemplate, TmplAstContent } from '@angular/compiler';
import { kebabCase } from 'change-case';
import { glob } from 'glob';
import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withDefaultConfig } from 'react-docgen-typescript';
import ts from 'typescript';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const docRoot = path.resolve(scriptDirectory, '..');
const projectRoot = path.resolve(docRoot, '../..');
const reactComponentsRoot = path.join(
  projectRoot,
  'packages/ui-react/src/lib/components',
);
const angularRoot = path.join(projectRoot, 'packages/ui-angular');
const angularSourceRoot = path.join(angularRoot, 'src/lib');
const outputDirectory = path.join(docRoot, 'src/data/api');

const parser = withDefaultConfig({
  propFilter: (prop) => {
    if (prop.name === 'key') return false;
    if (prop.parent?.fileName.includes('@types/react')) return false;
    return Boolean(prop.description || prop.defaultValue);
  },
});

const toProjectPath = (filePath) =>
  path.relative(projectRoot, filePath).split(path.sep).join('/');

const normalizeDefaultValue = (defaultValue) => {
  if (
    defaultValue === undefined ||
    defaultValue === null ||
    defaultValue.value === undefined ||
    defaultValue.value === 'undefined'
  ) {
    return null;
  }

  return { value: String(defaultValue.value) };
};

export const normalizeApiMember = (member, fallbackDescription = '') => ({
  name: member.name,
  description: (member.description || fallbackDescription).trim(),
  required: Boolean(member.required),
  type: { name: member.type?.name || 'unknown' },
  defaultValue: normalizeDefaultValue(member.defaultValue),
  ...(member.alias && member.alias !== member.name
    ? { alias: member.alias }
    : {}),
});

const unwrapFunctionExpression = (expression) => {
  while (ts.isParenthesizedExpression(expression)) {
    expression = expression.expression;
  }
  return ts.isArrowFunction(expression) || ts.isFunctionExpression(expression)
    ? expression
    : undefined;
};

const defaultsFromBindingPattern = (pattern, sourceFile) =>
  Object.fromEntries(
    pattern.elements.flatMap((element) => {
      if (
        ts.isOmittedExpression(element) ||
        element.dotDotDotToken ||
        !element.initializer ||
        !ts.isIdentifier(element.name)
      ) {
        return [];
      }
      const name = element.propertyName
        ? getPropertyName({ name: element.propertyName }, sourceFile)
        : element.name.text;
      return name ? [[name, element.initializer.getText(sourceFile)]] : [];
    }),
  );

export const extractReactRuntimeDefaults = (sourceText, displayName) => {
  const sourceFile = ts.createSourceFile(
    `${displayName}.tsx`,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let componentFunction;

  for (const statement of sourceFile.statements) {
    if (
      ts.isFunctionDeclaration(statement) &&
      statement.name?.text === displayName
    ) {
      componentFunction = statement;
      break;
    }
    if (!ts.isVariableStatement(statement)) continue;
    const declaration = statement.declarationList.declarations.find(
      (candidate) =>
        ts.isIdentifier(candidate.name) && candidate.name.text === displayName,
    );
    if (declaration?.initializer) {
      componentFunction = unwrapFunctionExpression(declaration.initializer);
      if (componentFunction) break;
    }
  }

  const parameter = componentFunction?.parameters[0];
  if (!parameter) return {};
  if (ts.isObjectBindingPattern(parameter.name)) {
    return defaultsFromBindingPattern(parameter.name, sourceFile);
  }
  if (!ts.isIdentifier(parameter.name) || !componentFunction.body) return {};

  const propsParameterName = parameter.name.text;
  let defaults = {};
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isObjectBindingPattern(node.name) &&
      ts.isIdentifier(node.initializer) &&
      node.initializer.text === propsParameterName
    ) {
      defaults = {
        ...defaults,
        ...defaultsFromBindingPattern(node.name, sourceFile),
      };
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(componentFunction.body);
  return defaults;
};

const normalizeReactComponent = (
  component,
  componentPath,
  runtimeDefaults,
) => ({
  filePath: toProjectPath(componentPath),
  description: component.description.trim(),
  tags: component.tags ?? {},
  methods: component.methods ?? [],
  props: Object.fromEntries(
    Object.entries(component.props ?? {}).map(([name, prop]) => [
      name,
      normalizeApiMember({
        ...prop,
        name,
        defaultValue: Object.hasOwn(runtimeDefaults, name)
          ? { value: runtimeDefaults[name] }
          : prop.defaultValue,
      }),
    ]),
  ),
});

const getSymbolDocumentation = (symbol, checker) => {
  if (!symbol) return { description: '', tags: {} };

  const tags = {};
  for (const tag of symbol.getJsDocTags(checker)) {
    const text = ts.displayPartsToString(tag.text).trim();
    if (!text) continue;
    tags[tag.name] = tags[tag.name] ? `${tags[tag.name]}\n${text}` : text;
  }

  return {
    description: ts
      .displayPartsToString(symbol.getDocumentationComment(checker))
      .trim(),
    tags,
  };
};

const getPropertyName = (property, sourceFile) => {
  if (!property.name) return undefined;
  if (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) {
    return property.name.text;
  }
  return property.name.getText(sourceFile);
};

const getAngularCoreImportName = (identifier, checker) => {
  const symbol = checker.getSymbolAtLocation(identifier);
  for (const declaration of symbol?.declarations ?? []) {
    if (!ts.isImportSpecifier(declaration)) continue;
    const importDeclaration = declaration.parent.parent.parent;
    if (
      ts.isImportDeclaration(importDeclaration) &&
      ts.isStringLiteral(importDeclaration.moduleSpecifier) &&
      importDeclaration.moduleSpecifier.text === '@angular/core'
    ) {
      return declaration.propertyName?.text ?? declaration.name.text;
    }
  }
  return undefined;
};

const getSignalKind = (initializer, checker) => {
  if (!initializer || !ts.isCallExpression(initializer)) return undefined;

  if (ts.isIdentifier(initializer.expression)) {
    const importedName = getAngularCoreImportName(
      initializer.expression,
      checker,
    );
    if (importedName === 'input') {
      return { kind: 'input', required: false };
    }
    if (importedName === 'output') {
      return { kind: 'output', required: false };
    }
  }

  if (
    ts.isPropertyAccessExpression(initializer.expression) &&
    ts.isIdentifier(initializer.expression.expression) &&
    getAngularCoreImportName(initializer.expression.expression, checker) ===
      'input' &&
    initializer.expression.name.text === 'required'
  ) {
    return { kind: 'input', required: true };
  }

  return undefined;
};

const getAlias = (call, sourceFile, signalKind) => {
  const optionsIndex =
    signalKind.kind === 'input' && !signalKind.required ? 1 : 0;
  const options = call.arguments[optionsIndex];
  if (!options || !ts.isObjectLiteralExpression(options)) return undefined;

  const aliasProperty = options.properties.find(
    (property) =>
      ts.isPropertyAssignment(property) &&
      getPropertyName(property, sourceFile) === 'alias',
  );
  if (
    !aliasProperty ||
    !ts.isPropertyAssignment(aliasProperty) ||
    !ts.isStringLiteralLike(aliasProperty.initializer)
  ) {
    return undefined;
  }

  return aliasProperty.initializer.text;
};

const typeFormatFlags =
  ts.TypeFormatFlags.NoTruncation |
  ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope;

const getSignalType = (call, checker, signalKind) => {
  const typeNode = call.typeArguments?.[0];
  if (typeNode) {
    const type = checker.getTypeFromTypeNode(typeNode);
    if (type.aliasSymbol?.name === 'NonNullable' && type.isUnion()) {
      return type.types
        .map((member) =>
          checker.typeToString(member, typeNode, typeFormatFlags),
        )
        .join(' | ');
    }
    return checker.typeToString(type, typeNode, typeFormatFlags);
  }

  if (signalKind.kind === 'input' && call.arguments[0]) {
    return checker.typeToString(
      checker.getBaseTypeOfLiteralType(
        checker.getWidenedType(checker.getTypeAtLocation(call.arguments[0])),
      ),
      call.arguments[0],
      typeFormatFlags,
    );
  }

  return 'unknown';
};

const getInputDefaultValue = (call, sourceFile, signalKind) => {
  if (signalKind.kind !== 'input' || signalKind.required) return null;
  const expression = call.arguments[0];
  if (!expression || expression.kind === ts.SyntaxKind.UndefinedKeyword) {
    return null;
  }
  return { value: expression.getText(sourceFile) };
};

const getReactFallbackDescription = (name, kind, reactProps) => {
  const isReactOnlyConvention = name === 'children' || /^on[A-Z]/.test(name);
  if (!isReactOnlyConvention && reactProps[name]?.description) {
    return reactProps[name].description;
  }
  if (kind !== 'output' || !name.endsWith('Change')) return '';

  const reactCallback = `on${name.charAt(0).toUpperCase()}${name.slice(1)}`;
  return reactProps[reactCallback]?.description ?? '';
};

const getSharedCatalogTags = (reactTags) =>
  Object.fromEntries(
    ['status', 'category', 'parent']
      .filter((name) => reactTags[name] !== undefined)
      .map((name) => [name, reactTags[name]]),
  );

const extractProjectedContent = (componentDecorator, sourceFile) => {
  const metadata = componentDecorator.expression.arguments[0];
  if (!metadata || !ts.isObjectLiteralExpression(metadata)) return undefined;

  const templateProperty = metadata.properties.find(
    (property) =>
      ts.isPropertyAssignment(property) &&
      getPropertyName(property, sourceFile) === 'template',
  );
  if (!templateProperty || !ts.isPropertyAssignment(templateProperty)) {
    return undefined;
  }

  const template = templateProperty.initializer;
  if (
    !ts.isStringLiteral(template) &&
    !ts.isNoSubstitutionTemplateLiteral(template)
  ) {
    return undefined;
  }

  const parsed = parseTemplate(template.text, sourceFile.fileName, {
    preserveWhitespaces: false,
  });
  if (parsed.errors?.length) {
    throw new Error(
      `Unable to parse Angular template in ${toProjectPath(sourceFile.fileName)}: ${parsed.errors.join(', ')}`,
    );
  }

  const slots = [];
  const visit = (nodes) => {
    for (const node of nodes) {
      if (node instanceof TmplAstContent) slots.push(node.selector || '*');
      if (Array.isArray(node.children)) visit(node.children);
      if (Array.isArray(node.branches)) visit(node.branches);
    }
  };
  visit(parsed.nodes);
  if (!slots.length) return undefined;

  return Object.fromEntries(
    slots.map((selector, index) => {
      const name = selector === '*' ? 'default' : `slot${index + 1}`;
      return [
        name,
        {
          name,
          selector,
          description:
            selector === '*'
              ? 'Default projected content.'
              : `Projected content matching \`${selector}\`.`,
        },
      ];
    }),
  );
};

const getComponentDecorator = (classDeclaration, checker) =>
  (ts.getDecorators(classDeclaration) ?? []).find((decorator) => {
    const expression = decorator.expression;
    return (
      ts.isCallExpression(expression) &&
      ts.isIdentifier(expression.expression) &&
      getAngularCoreImportName(expression.expression, checker) === 'Component'
    );
  });

export const extractAngularComponent = ({
  classDeclaration,
  checker,
  reactComponent,
}) => {
  const sourceFile = classDeclaration.getSourceFile();
  const componentDecorator = getComponentDecorator(classDeclaration, checker);
  if (
    !componentDecorator ||
    !ts.isCallExpression(componentDecorator.expression)
  ) {
    return undefined;
  }

  const classDocumentation = getSymbolDocumentation(
    checker.getSymbolAtLocation(classDeclaration.name),
    checker,
  );
  const inputs = {};
  const outputs = {};

  for (const member of classDeclaration.members) {
    if (
      !ts.isPropertyDeclaration(member) ||
      !member.initializer ||
      !ts.isCallExpression(member.initializer)
    ) {
      continue;
    }
    const signalKind = getSignalKind(member.initializer, checker);
    if (!signalKind) continue;

    const name = getPropertyName(member, sourceFile);
    if (!name) continue;
    const memberDocumentation = getSymbolDocumentation(
      checker.getSymbolAtLocation(member.name),
      checker,
    );
    const description =
      memberDocumentation.description ||
      getReactFallbackDescription(name, signalKind.kind, reactComponent.props);
    const normalized = normalizeApiMember(
      {
        name,
        description,
        required: signalKind.required,
        type: {
          name: getSignalType(member.initializer, checker, signalKind),
        },
        defaultValue: getInputDefaultValue(
          member.initializer,
          sourceFile,
          signalKind,
        ),
        alias: getAlias(member.initializer, sourceFile, signalKind),
      },
      description,
    );

    if (signalKind.kind === 'input') inputs[name] = normalized;
    else outputs[name] = normalized;
  }

  const content = extractProjectedContent(componentDecorator, sourceFile);
  return {
    filePath: toProjectPath(sourceFile.fileName),
    description: classDocumentation.description || reactComponent.description,
    tags: {
      ...getSharedCatalogTags(reactComponent.tags),
      ...classDocumentation.tags,
    },
    inputs,
    outputs,
    ...(content ? { content } : {}),
  };
};

const createAngularProgram = async () => {
  const configPath = path.join(angularRoot, 'tsconfig.lib.json');
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  if (configFile.error) {
    throw new Error(
      ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'),
    );
  }
  const config = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    angularRoot,
    undefined,
    configPath,
  );
  const angularFiles = await glob(path.join(angularSourceRoot, '**/*.ts'));
  return ts.createProgram({
    rootNames: angularFiles.sort(),
    options: config.options,
  });
};

const getAngularComponents = async () => {
  const program = await createAngularProgram();
  const checker = program.getTypeChecker();
  const components = new Map();

  for (const sourceFile of program.getSourceFiles()) {
    if (!sourceFile.fileName.startsWith(angularSourceRoot)) continue;
    for (const statement of sourceFile.statements) {
      if (
        ts.isClassDeclaration(statement) &&
        statement.name &&
        getComponentDecorator(statement, checker)
      ) {
        components.set(statement.name.text, {
          classDeclaration: statement,
          checker,
        });
      }
    }
  }
  return components;
};

export const generateApiDocs = async ({ requestedComponent } = {}) => {
  const normalizedRequest = requestedComponent?.toLowerCase();
  const angularComponents = await getAngularComponents();
  const componentPaths = (
    await glob(path.join(reactComponentsRoot, '**/*.tsx'))
  ).sort();
  const generated = new Map();

  for (const componentPath of componentPaths) {
    const displayName = path.basename(componentPath, '.tsx');
    if (normalizedRequest && displayName.toLowerCase() !== normalizedRequest) {
      continue;
    }

    const component = parser
      .parse(componentPath)
      .find((candidate) => candidate.displayName === displayName);
    if (!component) continue;

    const runtimeDefaults = extractReactRuntimeDefaults(
      await readFile(componentPath, 'utf8'),
      displayName,
    );
    const react = normalizeReactComponent(
      component,
      componentPath,
      runtimeDefaults,
    );
    const angularAdapter = angularComponents.get(displayName);
    const angular = angularAdapter
      ? extractAngularComponent({
          ...angularAdapter,
          reactComponent: react,
        })
      : undefined;
    const document = {
      schemaVersion: 2,
      displayName,
      defaultFramework: 'react',
      frameworks: {
        react,
        ...(angular ? { angular } : {}),
      },
    };
    generated.set(
      `${kebabCase(displayName)}.json`,
      `${JSON.stringify(document, null, 2)}\n`,
    );
  }

  return generated;
};

const synchronizeDocs = async ({ check, requestedComponent }) => {
  const generated = await generateApiDocs({ requestedComponent });
  await mkdir(outputDirectory, { recursive: true });
  const currentFiles = (await readdir(outputDirectory)).filter((name) =>
    name.endsWith('.json'),
  );
  const stale = [];
  const missing = [];

  for (const [fileName, expected] of generated) {
    const outputPath = path.join(outputDirectory, fileName);
    let current;
    try {
      current = await readFile(outputPath, 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    if (current === undefined) missing.push(fileName);
    else if (current !== expected) stale.push(fileName);
    if (!check && current !== expected) await writeFile(outputPath, expected);
  }

  const unexpected = requestedComponent
    ? []
    : currentFiles.filter((name) => !generated.has(name)).sort();
  if (!check) {
    for (const fileName of unexpected) {
      await unlink(path.join(outputDirectory, fileName));
    }
  }

  if (check && (stale.length || missing.length || unexpected.length)) {
    const details = [
      ...missing.map((name) => `missing: ${name}`),
      ...stale.map((name) => `stale: ${name}`),
      ...unexpected.map((name) => `unexpected: ${name}`),
    ];
    throw new Error(
      `Generated API documentation is not current:\n${details.join('\n')}`,
    );
  }

  return { generated: generated.size, stale, missing, unexpected };
};

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) ===
    path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const check = process.argv.includes('--check');
  try {
    const result = await synchronizeDocs({
      check,
      requestedComponent: process.env.DOCGEN_COMPONENT,
    });
    console.log(
      `${check ? 'Checked' : 'Generated'} ${result.generated} component API document(s).`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
