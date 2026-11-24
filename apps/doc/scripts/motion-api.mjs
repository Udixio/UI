// Generates apps/doc/src/data/motion-api.json, the data of the Animation API reference (/motion/api), from the sources:
// the public entries of @udixio/motion (the `development` condition of its package.json exports, which points at
// src/*.ts) and the motion surface of the React, Angular and Svelte adapters. Each symbol carries its signature, its
// parameters, members or inputs with their types, defaults and TSDoc, and the entries it is imported from.
//
// The grouping by task and the link to the need page that shows a symbol in use are not in the sources: they are the
// curated map of ./motion-api.groups.mjs, which this script checks against the sources (an export that no group holds,
// or a group that names a symbol that is not exported, fails the generation).
//
//   node scripts/motion-api.mjs           writes the JSON
//   node scripts/motion-api.mjs --check   fails when the JSON is not current
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { GROUPS, ADAPTER_GROUPS, HTML_GROUP } from './motion-api.groups.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const docRoot = path.resolve(scriptDirectory, '..');
const projectRoot = path.resolve(docRoot, '../..');
export const outputPath = path.join(docRoot, 'src/data/motion-api.json');
const motionRoot = path.join(projectRoot, 'packages/motion');

const toProjectPath = (filePath) => path.relative(projectRoot, filePath).split(path.sep).join('/');

const printFlags =
  ts.TypeFormatFlags.NoTruncation |
  ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope |
  ts.TypeFormatFlags.WriteArrowStyleSignature;

/** A type printed longer than this is not shown inline: the symbol's own page section explains it. */
const LONG_TYPE = 240;

/** Collapses the whitespace of a type written over several lines, so that it reads on one. */
const oneLine = (text) =>
  text
    .replace(/\/\/[^\n]*\n/g, '\n')
    .replace(/\s+/g, ' ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/<\s+/g, '<')
    .replace(/\s+>/g, '>')
    .replace(/\[\s+/g, '[')
    .replace(/\s+\]/g, ']')
    .replace(/^\|\s*/, '')
    .trim();

function createProgram(tsconfigPath, rootNames) {
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (configFile.error) throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'));
  const config = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(tsconfigPath), undefined, tsconfigPath);
  return ts.createProgram({ rootNames, options: { ...config.options, noEmit: true, composite: false, declaration: false } });
}

// ---------------------------------------------------------------------------------------------------------------------
// TSDoc

const tagText = (tag) => (typeof tag.comment === 'string' ? tag.comment : ts.getTextOfJSDocComment(tag.comment) ?? '').trim();

/** The description and the tags of a declaration, from its own doc comment. */
function docOf(node, checker, symbol) {
  const description = symbol
    ? ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim()
    : '';
  const tags = {};
  const examples = [];
  for (const tag of ts.getJSDocTags(node)) {
    const name = tag.tagName.text;
    if (name === 'param' || name === 'returns' || name === 'return' || name === 'typeParam' || name === 'template') continue;
    const text = tagText(tag);
    if (name === 'example') {
      examples.push(text.replace(/^```\w*\n?/, '').replace(/\n?```$/, '').trim());
      continue;
    }
    if (!text && name !== 'deprecated' && name !== 'internal') continue;
    tags[name] = tags[name] ? `${tags[name]}\n${text}` : text;
  }
  return { description, tags, examples };
}

/** The default of a member: its `@defaultValue` (or `@default`) tag, else what its description says it is. */
function defaultOf(node, description) {
  for (const tag of ts.getJSDocTags(node)) {
    if (tag.tagName.text === 'defaultValue' || tag.tagName.text === 'default') {
      const text = tagText(tag).replace(/^`|`$/g, '');
      if (text) return text;
    }
  }
  const flat = description.replace(/\s+/g, ' ');
  const said =
    flat.match(/(?:^|[.;:(]\s)Defaults?(?: to|:| is)? +(.+?)(?:\.\s|\.$|\)|$)/) ??
    flat.match(/(?:^|[.;:(]\s?|,\s)(`[^`]+`|[\w.'"-]+) by default((?: (?:for|when|on|in) [^.;]+)?)/) ??
    flat.match(/[;,]\s*by default (?:it is )?([^.;]+)/);
  if (!said) return null;
  return `${said[1]}${said[2] ?? ''}`.replace(/`/g, '').trim();
}

// ---------------------------------------------------------------------------------------------------------------------
// Declarations

const typeTextOf = (typeNode, sourceFile) => (typeNode ? oneLine(typeNode.getText(sourceFile)) : null);

/** The parameters of a signature declaration, with their TSDoc, defaults and, for an inline options object, its fields. */
function paramsOf(declaration, checker) {
  const sourceFile = declaration.getSourceFile();
  return declaration.parameters.map((parameter) => {
    // A destructured parameter (`{ threshold = 0 }: ActiveOptions`) is named after its @param tag, else `options`.
    const tagged = ts.getJSDocParameterTags(parameter)[0]?.name?.getText(sourceFile);
    const name = ts.isIdentifier(parameter.name) ? parameter.name.text : (tagged ?? 'options');
    const docs = ts
      .getJSDocParameterTags(parameter)
      .map(tagText)
      .join(' ')
      .replace(/^-\s*/, '');
    let type = typeTextOf(parameter.type, sourceFile);
    if (type === null) {
      type = checker.typeToString(checker.getTypeAtLocation(parameter), parameter, printFlags);
    }
    const fields =
      parameter.type && ts.isTypeLiteralNode(parameter.type) ? membersOfTypeLiteral(parameter.type, checker) : undefined;
    return {
      name: parameter.dotDotDotToken ? `...${name}` : name,
      type,
      optional: Boolean(parameter.questionToken || parameter.initializer || parameter.dotDotDotToken),
      default: parameter.initializer ? oneLine(parameter.initializer.getText(sourceFile)) : null,
      description: docs,
      ...(fields ? { fields } : {}),
    };
  });
}

function returnsOf(declaration, checker) {
  const sourceFile = declaration.getSourceFile();
  const tag = ts.getJSDocReturnTag(declaration);
  let type = typeTextOf(declaration.type, sourceFile);
  if (type === null) {
    const signature = checker.getSignatureFromDeclaration(declaration);
    type = signature ? checker.typeToString(checker.getReturnTypeOfSignature(signature), declaration, printFlags) : 'void';
  }
  return { type, description: tag ? tagText(tag) : '' };
}

function typeParametersOf(declaration) {
  const sourceFile = declaration.getSourceFile();
  return declaration.typeParameters?.length
    ? `<${declaration.typeParameters.map((parameter) => oneLine(parameter.getText(sourceFile))).join(', ')}>`
    : '';
}

function signatureText(name, declaration, checker) {
  const params = paramsOf(declaration, checker)
    .map((parameter) => `${parameter.name}${parameter.optional && !parameter.name.startsWith('...') ? '?' : ''}: ${parameter.type}`)
    .join(', ');
  return `${name}${typeParametersOf(declaration)}(${params}): ${returnsOf(declaration, checker).type}`;
}

/** The members of an interface or an object type: properties and methods, with their TSDoc. */
function membersOfTypeLiteral(node, checker) {
  const sourceFile = node.getSourceFile();
  const members = [];
  for (const member of node.members) {
    if (!member.name) continue;
    const name = member.name.getText(sourceFile);
    const symbol = checker.getSymbolAtLocation(member.name);
    const { description, tags } = docOf(member, checker, symbol);
    const modifiers = ts.getCombinedModifierFlags(member);
    if (modifiers & ts.ModifierFlags.Private || tags.internal !== undefined) continue;
    let type;
    if (ts.isMethodSignature(member)) {
      const params = paramsOf(member, checker)
        .map((parameter) => `${parameter.name}${parameter.optional ? '?' : ''}: ${parameter.type}`)
        .join(', ');
      type = `${typeParametersOf(member)}(${params}) => ${returnsOf(member, checker).type}`;
    } else if (ts.isGetAccessorDeclaration(member)) {
      type = typeTextOf(member.type, sourceFile) ?? checker.typeToString(checker.getTypeAtLocation(member), member, printFlags);
    } else {
      type = typeTextOf(member.type, sourceFile) ?? checker.typeToString(checker.getTypeAtLocation(member), member, printFlags);
    }
    if (type.length > LONG_TYPE) type = null;
    members.push({
      name,
      type,
      optional: Boolean(member.questionToken),
      readonly: Boolean(ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Readonly) || ts.isGetAccessorDeclaration(member),
      default: defaultOf(member, description),
      description,
      ...(tags.deprecated !== undefined ? { deprecated: tags.deprecated || true } : {}),
    });
  }
  return members;
}

/**
 * The object members of a type alias: the literal itself, or the literals of an intersection, whose other parts are
 * returned as what the alias extends (`MotionOwnProps & Omit<…> & { as?, ref? }`).
 */
function aliasMembers(typeNode, checker) {
  if (ts.isTypeLiteralNode(typeNode)) return { members: membersOfTypeLiteral(typeNode, checker), extends: [] };
  if (ts.isIntersectionTypeNode(typeNode) && typeNode.types.some((each) => ts.isTypeLiteralNode(each))) {
    const sourceFile = typeNode.getSourceFile();
    return {
      members: typeNode.types.filter(ts.isTypeLiteralNode).flatMap((each) => membersOfTypeLiteral(each, checker)),
      extends: typeNode.types.filter((each) => !ts.isTypeLiteralNode(each)).map((each) => oneLine(each.getText(sourceFile))),
    };
  }
  return undefined;
}

const resolvedDeclaration = (symbol, checker) =>
  (symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol).declarations?.[0];

const isCallableType = (type) => type.getCallSignatures().length > 0;

/** One exported symbol of the sources, as the reference shows it. */
function describeSymbol(name, symbol, checker) {
  const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  const declarations = target.declarations ?? [];
  const declaration = declarations[0];
  if (!declaration) throw new Error(`motion-api: ${name} has no declaration`);
  const sourceFile = declaration.getSourceFile();
  const base = { name, source: toProjectPath(sourceFile.fileName) };

  if (ts.isFunctionDeclaration(declaration)) {
    const overloads = declarations.filter(ts.isFunctionDeclaration);
    const signatures = overloads.length > 1 ? overloads.filter((each) => !each.body) : overloads;
    const primary = signatures[signatures.length - 1];
    const docNode = signatures.find((each) => ts.getJSDocCommentsAndTags(each).length > 0) ?? primary;
    const { description, tags, examples } = docOf(docNode, checker, target);
    return {
      ...base,
      kind: 'function',
      signatures: signatures.map((each) => signatureText(name, each, checker)),
      params: paramsOf(primary, checker),
      returns: returnsOf(primary, checker),
      description,
      tags,
      examples,
    };
  }

  if (ts.isVariableDeclaration(declaration)) {
    const statement = declaration.parent.parent;
    const { description, tags, examples } = docOf(statement, checker, target);
    const type = checker.getTypeOfSymbolAtLocation(target, declaration);
    const initializer = declaration.initializer;
    const fn =
      initializer && (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer)) ? initializer : undefined;
    if (fn || (!declaration.type && isCallableType(type))) {
      const signature = type.getCallSignatures()[0];
      const node = fn ?? signature.getDeclaration();
      return {
        ...base,
        kind: 'function',
        signatures: fn
          ? [signatureText(name, fn, checker)]
          : type.getCallSignatures().map((each) => `${name}${checker.signatureToString(each, declaration, printFlags)}`),
        params: node && ts.isFunctionLike(node) ? paramsOf(node, checker) : [],
        returns: node && ts.isFunctionLike(node) ? returnsOf(node, checker) : { type: '', description: '' },
        description,
        tags,
        examples,
      };
    }
    let typeText = typeTextOf(declaration.type, sourceFile) ?? checker.typeToString(type, declaration, printFlags);
    if (typeText.length > LONG_TYPE) typeText = null;
    const objectMembers =
      declaration.type && ts.isTypeLiteralNode(declaration.type) ? membersOfTypeLiteral(declaration.type, checker) : undefined;
    return {
      ...base,
      kind: 'constant',
      signatures: [`const ${name}${typeText ? `: ${typeText}` : ''}`],
      type: typeText,
      ...(objectMembers ? { members: objectMembers } : {}),
      description,
      tags,
      examples,
    };
  }

  if (ts.isInterfaceDeclaration(declaration)) {
    const { description, tags, examples } = docOf(declaration, checker, target);
    const heritage = declaration.heritageClauses?.map((clause) => oneLine(clause.getText(sourceFile))).join(' ') ?? '';
    return {
      ...base,
      kind: 'interface',
      signatures: [`interface ${name}${typeParametersOf(declaration)}${heritage ? ` ${heritage}` : ''}`],
      members: declarations.filter(ts.isInterfaceDeclaration).flatMap((each) => membersOfTypeLiteral(each, checker)),
      description,
      tags,
      examples,
    };
  }

  if (ts.isTypeAliasDeclaration(declaration)) {
    const { description, tags, examples } = docOf(declaration, checker, target);
    const object = aliasMembers(declaration.type, checker);
    let typeText = oneLine(declaration.type.getText(sourceFile));
    if (object) typeText = [...object.extends, '{ … }'].join(' & ');
    else if (typeText.length > LONG_TYPE) {
      // A long alias is shown resolved when that is shorter (a union of literals), else not inline.
      const resolved = checker.typeToString(checker.getTypeAtLocation(declaration.name), declaration, printFlags);
      typeText = resolved.length <= LONG_TYPE && resolved !== name && !resolved.startsWith(`${name}<`) ? resolved : null;
    }
    // An alias of another alias (Verb = ManifestVerb) also gives what it stands for, when that is short.
    let resolved = null;
    if (!object && typeText !== null && !declaration.typeParameters) {
      const expanded = checker.typeToString(
        checker.getTypeAtLocation(declaration.name),
        undefined,
        printFlags | ts.TypeFormatFlags.InTypeAlias,
      );
      if (!/(?:^|[^\w])'|"|(?<!\$)\{/.test(typeText.replace(/<'[^']*'>/g, '')) && /["']/.test(expanded) && expanded.length <= LONG_TYPE) resolved = expanded;
    }
    return {
      ...base,
      kind: 'type',
      signatures: [`type ${name}${typeParametersOf(declaration)}${typeText ? ` = ${typeText}` : ''}`],
      type: typeText,
      ...(resolved ? { resolved } : {}),
      ...(object ? { members: object.members } : {}),
      description,
      tags,
      examples,
    };
  }

  if (ts.isClassDeclaration(declaration)) {
    return describeClass(name, declaration, target, checker, base);
  }

  throw new Error(`motion-api: ${name} is a ${ts.SyntaxKind[declaration.kind]}, which the generator does not describe`);
}

// ---------------------------------------------------------------------------------------------------------------------
// Angular directives

const LIFECYCLE = new Set(['ngOnInit', 'ngOnDestroy', 'ngOnChanges', 'ngAfterViewInit', 'ngAfterContentInit', 'ngDoCheck', 'constructor']);

function decoratorArgument(declaration, sourceFile) {
  for (const decorator of ts.getDecorators(declaration) ?? []) {
    const call = decorator.expression;
    if (!ts.isCallExpression(call) || call.expression.getText(sourceFile) !== 'Directive') continue;
    const argument = call.arguments[0];
    if (!argument || !ts.isObjectLiteralExpression(argument)) return {};
    const read = (key) => {
      const property = argument.properties.find(
        (each) => ts.isPropertyAssignment(each) && each.name.getText(sourceFile) === key,
      );
      return property && ts.isStringLiteralLike(property.initializer) ? property.initializer.text : undefined;
    };
    return { selector: read('selector'), exportAs: read('exportAs') };
  }
  return undefined;
}

/** The signal API call of a class field: `input`, `input.required`, `output`, `model`, or none. */
function signalCall(initializer, sourceFile) {
  if (!initializer || !ts.isCallExpression(initializer)) return undefined;
  const callee = initializer.expression.getText(sourceFile);
  if (callee === 'input' || callee === 'input.required' || callee === 'output' || callee === 'model' || callee === 'model.required') {
    return { kind: callee.split('.')[0], required: callee.endsWith('.required'), call: initializer };
  }
  return undefined;
}

function aliasOf(call, sourceFile) {
  for (const argument of call.arguments) {
    if (!ts.isObjectLiteralExpression(argument)) continue;
    const alias = argument.properties.find((each) => ts.isPropertyAssignment(each) && each.name.getText(sourceFile) === 'alias');
    if (alias && ts.isStringLiteralLike(alias.initializer)) return alias.initializer.text;
  }
  return undefined;
}

function describeClass(name, declaration, symbol, checker, base) {
  const sourceFile = declaration.getSourceFile();
  const { description, tags, examples } = docOf(declaration, checker, symbol);
  const directive = decoratorArgument(declaration, sourceFile);
  const inputs = [];
  const outputs = [];
  const methods = [];
  for (const member of declaration.members) {
    if (!member.name || ts.isConstructorDeclaration(member)) continue;
    const flags = ts.getCombinedModifierFlags(member);
    if (flags & (ts.ModifierFlags.Private | ts.ModifierFlags.Protected) || ts.isPrivateIdentifier(member.name)) continue;
    const memberName = member.name.getText(sourceFile);
    const memberSymbol = checker.getSymbolAtLocation(member.name);
    const doc = docOf(member, checker, memberSymbol);
    if (doc.tags.internal !== undefined) continue;
    if (ts.isPropertyDeclaration(member)) {
      const signal = signalCall(member.initializer, sourceFile);
      if (signal) {
        const typeArgument = signal.call.typeArguments?.[0];
        let type = typeArgument ? oneLine(typeArgument.getText(sourceFile)) : null;
        const first = signal.call.arguments[0];
        const hasDefault = signal.kind !== 'output' && !signal.required && first && !ts.isObjectLiteralExpression(first);
        if (type === null && hasDefault) {
          type = checker.typeToString(checker.getBaseTypeOfLiteralType(checker.getTypeAtLocation(first)), first, printFlags);
        }
        const entry = {
          name: aliasOf(signal.call, sourceFile) ?? memberName,
          property: memberName,
          type: type ?? 'void',
          required: signal.required,
          default: hasDefault && first.getText(sourceFile) !== 'undefined' ? oneLine(first.getText(sourceFile)) : null,
          description: doc.description,
        };
        (signal.kind === 'output' ? outputs : inputs).push(signal.kind === 'model' ? { ...entry, model: true } : entry);
        continue;
      }
      if (!doc.description) continue;
      methods.push({
        name: memberName,
        signature: `${memberName}: ${typeTextOf(member.type, sourceFile) ?? checker.typeToString(checker.getTypeAtLocation(member), member, printFlags)}`,
        description: doc.description,
      });
      continue;
    }
    if (ts.isMethodDeclaration(member) || ts.isGetAccessorDeclaration(member)) {
      if (LIFECYCLE.has(memberName) || !doc.description) continue;
      methods.push({
        name: memberName,
        signature: ts.isGetAccessorDeclaration(member)
          ? `get ${memberName}(): ${returnsOf(member, checker).type}`
          : signatureText(memberName, member, checker),
        description: doc.description,
      });
    }
  }
  return {
    ...base,
    kind: directive ? 'directive' : 'class',
    signatures: [directive?.selector ? `@Directive({ selector: '${directive.selector}'${directive.exportAs ? `, exportAs: '${directive.exportAs}'` : ''} }) class ${name}` : `class ${name}`],
    ...(directive ? { selector: directive.selector ?? null, exportAs: directive.exportAs ?? null } : {}),
    inputs,
    outputs,
    methods,
    description,
    tags,
    examples,
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// Sources

/** The entries of @udixio/motion: each subpath of its package.json exports, with the source file it resolves to. */
async function motionEntries() {
  const manifest = JSON.parse(await readFile(path.join(motionRoot, 'package.json'), 'utf8'));
  const entries = [];
  const files = [];
  for (const [subpath, target] of Object.entries(manifest.exports)) {
    const entry = subpath === '.' ? '@udixio/motion' : `@udixio/motion/${subpath.slice(2)}`;
    const source = typeof target === 'string' ? target : target.development ?? target.default;
    if (!source.endsWith('.ts')) {
      files.push({ entry, file: source.replace(/^\.\//, '') });
      continue;
    }
    entries.push({ entry, file: path.join(motionRoot, source) });
  }
  return { entries, files };
}

function moduleExports(program, file) {
  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(file);
  if (!sourceFile) throw new Error(`motion-api: ${toProjectPath(file)} is not in the program`);
  const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
  return moduleSymbol ? checker.getExportsOfModule(moduleSymbol) : [];
}

/** The motion surface of an adapter: the exports of its index whose declaration lives in one of `folders`. */
function adapterExports(program, index, folders) {
  const checker = program.getTypeChecker();
  return moduleExports(program, index).filter((symbol) => {
    const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
    const file = target.declarations?.[0]?.getSourceFile().fileName ?? '';
    return folders.some((folder) => file.includes(folder));
  });
}

const ADAPTERS = [
  {
    id: 'react',
    package: '@udixio/ui-react',
    root: 'packages/ui-react',
    index: 'src/index.ts',
    folders: ['/src/lib/motion/', '/src/lib/hooks/useMotion'],
  },
  {
    id: 'angular',
    package: '@udixio/ui-angular',
    root: 'packages/ui-angular',
    index: 'src/index.ts',
    folders: ['/src/lib/motion/'],
  },
  {
    id: 'svelte',
    package: '@udixio/ui-svelte',
    root: 'packages/ui-svelte',
    index: 'src/index.ts',
    folders: ['/src/lib/motion/'],
  },
];

/** Reads the TSDoc gaps a symbol leaves: no description of its own, or a parameter, member or input without one. */
function gapsOf(id, symbol) {
  const gaps = [];
  if (!symbol.description) gaps.push(`${id}: no description`);
  for (const parameter of symbol.params ?? []) {
    if (!parameter.description) gaps.push(`${id}(${parameter.name}): no @param`);
  }
  for (const member of [...(symbol.members ?? []), ...(symbol.inputs ?? []), ...(symbol.outputs ?? [])]) {
    if (!member.description) gaps.push(`${id}.${member.name}: no description`);
  }
  return gaps;
}

export async function generateMotionApi() {
  const { entries, files } = await motionEntries();
  const motionProgram = createProgram(
    path.join(motionRoot, 'tsconfig.lib.json'),
    entries.map((each) => each.file),
  );
  const motionChecker = motionProgram.getTypeChecker();
  const symbols = new Map();
  const declarationsById = new Map();
  const entryList = [];

  for (const { entry, file } of entries) {
    const exported = moduleExports(motionProgram, file).sort((a, b) => a.name.localeCompare(b.name));
    entryList.push({ entry, source: toProjectPath(file), exports: exported.map((each) => each.name) });
    for (const symbol of exported) {
      const id = `api-${symbol.name}`;
      const existing = symbols.get(id);
      if (existing) {
        existing.entries.push(entry);
        // The same name from another declaration (the layout entry's own flushLayoutAround): its description is kept.
        const declaration = resolvedDeclaration(symbol, motionChecker);
        if (declaration !== declarationsById.get(id)) {
          const other = describeSymbol(symbol.name, symbol, motionChecker);
          (existing.variants ??= []).push({ entry, source: other.source, description: other.description });
        }
        continue;
      }
      declarationsById.set(id, resolvedDeclaration(symbol, motionChecker));
      symbols.set(id, {
        id,
        package: '@udixio/motion',
        entries: [entry],
        ...describeSymbol(symbol.name, symbol, motionChecker),
      });
    }
  }

  for (const adapter of ADAPTERS) {
    const root = path.join(projectRoot, adapter.root);
    const index = path.join(root, adapter.index);
    const program = createProgram(path.join(root, 'tsconfig.lib.json'), [index]);
    const checker = program.getTypeChecker();
    const exported = adapterExports(program, index, adapter.folders).sort((a, b) => a.name.localeCompare(b.name));
    entryList.push({ entry: adapter.package, source: toProjectPath(index), exports: exported.map((each) => each.name), adapter: adapter.id });
    for (const symbol of exported) {
      const id = `${adapter.id}-${symbol.name}`;
      symbols.set(id, {
        id,
        package: adapter.package,
        entries: [adapter.package],
        framework: adapter.id,
        ...describeSymbol(symbol.name, symbol, checker),
      });
    }
  }

  // A need is the slug of a page under /motion/, with an optional `#section` of that page (`values#counters`).
  const hasPage = (need) => existsSync(path.join(docRoot, 'src/pages/motion', `${need.split('#')[0]}.astro`));

  // The curated groups: every symbol in exactly one, and every name a group gives is a symbol of the sources.
  const placed = new Map();
  const place = (groupId, id, need) => {
    if (!symbols.has(id)) throw new Error(`motion-api: the group "${groupId}" names ${id}, which no entry exports`);
    if (placed.has(id)) throw new Error(`motion-api: ${id} is in both "${placed.get(id)}" and "${groupId}"`);
    if (need && !hasPage(need)) {
      throw new Error(`motion-api: ${id} links to the need "${need}", which has no page`);
    }
    placed.set(id, groupId);
    const symbol = symbols.get(id);
    symbol.group = groupId;
    symbol.need = need ? `/motion/${need}` : null;
  };
  const groups = [];
  for (const group of [...GROUPS, ...ADAPTER_GROUPS]) {
    const ids = [];
    for (const section of group.sections) {
      for (const [name, need] of Object.entries(section.symbols)) {
        const id = group.framework ? `${group.framework}-${name}` : `api-${name}`;
        place(group.id, id, need);
        ids.push(id);
      }
    }
    groups.push({
      id: group.id,
      title: group.title,
      intro: group.intro,
      ...(group.framework ? { framework: group.framework } : {}),
      sections: group.sections.map((section) => ({
        title: section.title ?? null,
        symbols: Object.keys(section.symbols).map((name) => (group.framework ? `${group.framework}-${name}` : `api-${name}`)),
      })),
      ...(group.adapters ? { adapters: group.adapters } : {}),
    });
  }
  const unplaced = [...symbols.keys()].filter((id) => !placed.has(id));
  if (unplaced.length) {
    throw new Error(`motion-api: exported but in no group of motion-api.groups.mjs: ${unplaced.join(', ')}`);
  }
  for (const group of groups) {
    for (const adapterId of group.adapters ?? []) {
      if (!symbols.has(adapterId)) throw new Error(`motion-api: the group "${group.id}" points to ${adapterId}, which no adapter exports`);
    }
  }
  for (const item of HTML_GROUP.items) {
    if (item.need && !hasPage(item.need)) {
      throw new Error(`motion-api: the attribute ${item.name} links to the need "${item.need}", which has no page`);
    }
  }

  const gaps = [...symbols.entries()].flatMap(([id, symbol]) => gapsOf(id, symbol));
  const document = {
    schemaVersion: 1,
    generatedBy: 'apps/doc/scripts/motion-api.mjs',
    entries: entryList,
    files,
    groups,
    html: {
      id: HTML_GROUP.id,
      title: HTML_GROUP.title,
      intro: HTML_GROUP.intro,
      items: HTML_GROUP.items.map((item) => ({ ...item, need: item.need ? `/motion/${item.need}` : null })),
    },
    symbols: Object.fromEntries([...symbols.entries()].sort(([a], [b]) => a.localeCompare(b))),
  };
  return { json: `${JSON.stringify(document, null, 2)}\n`, gaps };
}

export async function checkMotionApi() {
  const { json } = await generateMotionApi();
  let current;
  try {
    current = await readFile(outputPath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  return { current: current === json, expected: json, actual: current };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  try {
    if (process.argv.includes('--check')) {
      const { current } = await checkMotionApi();
      if (!current) throw new Error(`${toProjectPath(outputPath)} is not current: run node apps/doc/scripts/motion-api.mjs`);
      console.log(`Checked ${toProjectPath(outputPath)}.`);
    } else {
      const { json, gaps } = await generateMotionApi();
      await writeFile(outputPath, json);
      const count = Object.keys(JSON.parse(json).symbols).length;
      console.log(`Generated ${toProjectPath(outputPath)}: ${count} symbols.`);
      if (process.argv.includes('--gaps')) console.log(gaps.join('\n'));
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
