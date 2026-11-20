import { VISUALLY_HIDDEN } from './visually-hidden.js';

/** What a split cuts the text into: letters (graphemes), words or lines. */
export type SplitBy = 'chars' | 'words' | 'lines';

/** A text cut into pieces that can move, and the way back to the element as it was. */
export interface TextSplit {
  readonly by: SplitBy;
  /** The pieces that move, in text order: letters (graphemes), words or lines. */
  readonly pieces: readonly HTMLElement[];
  /** Puts the element back as it was: the original nodes, in place, and nothing added. */
  revert(): void;
}

/** The elements a split must leave whole: a link or a control is reached by its text, so the text is never cut. */
const INTERACTIVE =
  'a[href], button, input, select, textarea, [tabindex], [contenteditable]:not([contenteditable="false"])';
/** The elements whose own text is a value: a split of the element would break what the user types or selects. */
const FORM_CONTROL = 'input, select, textarea, [contenteditable]:not([contenteditable="false"])';
/**
 * The scripts whose letters join (Hebrew, Arabic, Syriac, Indic, Thai, Lao, Tibetan, Myanmar, Khmer, Mongolian and their
 * presentation forms): a text in one is cut in words, since a lone letter loses its form.
 */
const JOINING =
  /[֐-ࣿऀ-෿฀-໿ༀ-࿿က-႟ក-៿᠀-᢯יִ-﷿ﹰ-﻿]/;
/** A breaking space splits a word; the non-breaking spaces stay inside their word. */
const BREAKING_SPACE = /([^\S   ]+)/;
const SEPARATOR = /^[^\S   ]+$/;
const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';

/** A run of text between two breaking spaces, or one breaking space. */
interface Token {
  text: string;
  readonly space: boolean;
}

/** The split of each element that is split, live until it is reverted. */
const splits = new WeakMap<HTMLElement, Split>();
/** The elements a development warning was already written for. */
const warned = new WeakSet<Element>();
const segmenters = new Map<string, Intl.Segmenter>();

/**
 * Split the text of an element into letters, words or lines, pieces that an animation can move one by one. Returns
 * undefined, and leaves the element as it is, when it holds an interactive element or no text.
 */
export function splitText(element: HTMLElement, options: { by: SplitBy }): TextSplit | undefined {
  const current = splits.get(element);
  if (current?.by === options.by) return current;
  current?.revert();
  if (!splittable(element)) return undefined;
  const split = new Split(element, options.by);
  splits.set(element, split);
  return split;
}

/** The split of an element, if its text is split. */
export function getSplit(element: HTMLElement): TextSplit | undefined {
  return splits.get(element);
}

/** Whether the text of an element can be split: it has text, and no interactive element a split would have to cut. */
function splittable(element: HTMLElement): boolean {
  if (element.matches(FORM_CONTROL) || element.querySelector(INTERACTIVE) !== null) {
    warnOnce(element, 'the element holds an interactive element, so its text is left whole and not split.');
    return false;
  }
  return /\S/.test(element.textContent ?? '');
}

/** Writes a development warning for an element, once. */
function warnOnce(element: Element, message: string): void {
  if (!__MOTION_CHECKS__ || warned.has(element)) return;
  warned.add(element);
  console.warn(`[@udixio/motion] splitText: ${message}`);
}

/** The segmenter of a language and granularity, made once; an unknown language falls back to the default locale. */
function segmenter(lang: string | undefined, granularity: 'word' | 'grapheme'): Intl.Segmenter {
  const key = `${granularity}|${lang ?? ''}`;
  let found = segmenters.get(key);
  if (!found) {
    try {
      found = new Intl.Segmenter(lang, { granularity });
    } catch {
      found = new Intl.Segmenter(undefined, { granularity });
    }
    segmenters.set(key, found);
  }
  return found;
}

/** The language of a text node: its closest `lang`, else the document's. */
function langOf(node: Node): string | undefined {
  const tagged = node.parentElement?.closest<HTMLElement>('[lang]');
  return tagged?.lang || document.documentElement.lang || undefined;
}

/**
 * The tokens of a text: each breaking space is a token of its own, and the text between two of them is a word. Two
 * word-like segments that touch make two words (a Japanese or Chinese run has no space between its words); any other
 * segment, such as punctuation or a non-breaking space, stays in the word it touches.
 */
function tokenize(text: string, lang: string | undefined): Token[] {
  const tokens: Token[] = [];
  let open = false;
  let previousWordLike = false;
  for (const { segment, isWordLike = false } of segmenter(lang, 'word').segment(text)) {
    for (const part of segment.split(BREAKING_SPACE)) {
      if (part === '') continue;
      if (SEPARATOR.test(part)) {
        tokens.push({ text: part, space: true });
        open = false;
      } else if (open && !(isWordLike && previousWordLike)) {
        tokens[tokens.length - 1].text += part;
      } else {
        tokens.push({ text: part, space: false });
        open = true;
      }
    }
    previousWordLike = isWordLike;
  }
  return tokens;
}

/** A span with the given inline style, and no other attribute. */
function span(style: string): HTMLSpanElement {
  const element = document.createElement('span');
  element.style.cssText = style;
  return element;
}

/** Writes one text node into the copy, cut into its words (or its letters for chars), and collects the pieces it makes. */
function emitText(text: string, lang: string | undefined, parent: Element, by: SplitBy, pieces: HTMLElement[]): void {
  // A joining script is cut in words even for letters: a lone letter of it loses its form.
  const letters = by === 'chars' && !JOINING.test(text);
  for (const token of tokenize(text, lang)) {
    if (token.space) {
      parent.append(token.text);
      continue;
    }
    // A word of chars does not wrap inside itself: its letters break nowhere.
    const word = span(by === 'chars' ? 'display:inline-block;white-space:nowrap' : 'display:inline-block');
    if (letters) {
      // The letters of a word are pieces; the word is only the box that keeps them together.
      for (const { segment } of segmenter(lang, 'grapheme').segment(token.text)) {
        // A whitespace grapheme (a non-breaking space) stays text: it is never a piece.
        if (/\s/.test(segment)) {
          word.append(segment);
        } else {
          const piece = span('display:inline-block');
          piece.setAttribute('data-udx-piece', '');
          piece.textContent = segment;
          word.append(piece);
          pieces.push(piece);
        }
      }
    } else {
      word.textContent = token.text;
      if (by === 'lines') {
        word.setAttribute('data-udx-line-word', '');
      } else {
        word.setAttribute('data-udx-piece', '');
        pieces.push(word);
      }
    }
    parent.append(word);
  }
}

/** Copies one original node into the copy: text is cut, an element is cloned without its id and its children are copied. */
function copyNode(node: Node, parent: Element, by: SplitBy, pieces: HTMLElement[]): void {
  if (node.nodeType === Node.TEXT_NODE) {
    emitText((node as Text).data, langOf(node), parent, by, pieces);
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const element = node as Element;
  if (element.namespaceURI !== HTML_NAMESPACE) {
    // SVG and MathML keep their text whole: a deep clone, with no id.
    const clone = element.cloneNode(true) as Element;
    for (const el of [clone, ...clone.querySelectorAll('[id]')]) el.removeAttribute('id');
    parent.append(clone);
    return;
  }
  const clone = element.cloneNode(false) as Element;
  clone.removeAttribute('id');
  parent.append(clone);
  for (const child of Array.from(element.childNodes)) copyNode(child, clone, by, pieces);
}

/** The width a line is broken to: the content box of the element. */
function contentWidth(element: HTMLElement): number {
  const style = getComputedStyle(element);
  return (
    element.clientWidth - (Number.parseFloat(style.paddingLeft) || 0) - (Number.parseFloat(style.paddingRight) || 0)
  );
}

/**
 * Groups the line words of a copy into lines: each line becomes a block piece, the spaces between two lines go, and a
 * line break stays with the line it ends.
 */
function layOutLines(copy: HTMLElement): HTMLElement[] {
  const words = Array.from(copy.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement && child.hasAttribute('data-udx-line-word'),
  );
  // One pass reads every position before any write moves a word.
  const geometry = words.map(word => ({ top: word.offsetTop, height: word.offsetHeight }));
  const lines: Array<{ first: Element; last: Element }> = [];
  words.forEach((word, index) => {
    const { top, height } = geometry[index];
    const line = lines.at(-1);
    if (line && Math.abs(top - geometry[index - 1].top) < height / 2) line.last = word;
    else lines.push({ first: word, last: word });
  });
  const pieces: HTMLElement[] = [];
  for (const { first, last } of lines) {
    const line = span('display:block');
    line.setAttribute('data-udx-piece', '');
    first.before(line);
    for (let node: ChildNode | null = first; node; ) {
      const next: ChildNode | null = node.nextSibling;
      line.append(node);
      if (node === last) break;
      node = next;
    }
    pieces.push(line);
  }
  let previous: HTMLElement | undefined;
  for (const node of Array.from(copy.childNodes)) {
    if (pieces.includes(node as HTMLElement)) previous = node as HTMLElement;
    else if (node.nodeType === Node.TEXT_NODE && !/\S/.test(node.textContent ?? '')) node.remove();
    else previous?.append(node);
  }
  return pieces;
}

/** A split text, live until it is reverted: its observers keep the copy in step with the text and the width. */
class Split implements TextSplit {
  readonly by: SplitBy;
  readonly #element: HTMLElement;
  readonly #mode: SplitBy;
  readonly #source: HTMLElement;
  readonly #text: MutationObserver;
  readonly #size: ResizeObserver | undefined;
  #copy: HTMLElement | undefined;
  #pieces: HTMLElement[] = [];
  #width = 0;
  #settling = false;
  #live = true;

  constructor(element: HTMLElement, by: SplitBy) {
    this.by = by;
    this.#element = element;
    // Lines hold only when the text has no inline element other than a line break: otherwise they are words.
    const nested = by === 'lines' && element.querySelector('*:not(br)') !== null;
    if (nested) warnOnce(element, '"lines" falls back to "words", because the text holds inline elements.');
    this.#mode = nested ? 'words' : by;
    this.#source = document.createElement('span');
    this.#source.setAttribute('data-udx-split-source', '');
    this.#source.style.cssText = VISUALLY_HIDDEN;
    this.#source.append(...Array.from(element.childNodes));
    element.append(this.#source);
    try {
      this.#render();
    } catch (error) {
      // A split that cannot be built leaves the element as it was, and the error reaches the caller.
      for (const node of Array.from(this.#source.childNodes)) element.insertBefore(node, this.#source);
      this.#source.remove();
      this.#copy?.remove();
      throw error;
    }
    this.#text = new MutationObserver(() => {
      if (this.#live) this.#render();
    });
    this.#text.observe(this.#source, { characterData: true, childList: true, subtree: true });
    if (this.#mode === 'lines') {
      this.#size = new ResizeObserver(() => this.#relayout());
      this.#size.observe(element);
    }
  }

  get pieces(): readonly HTMLElement[] {
    return this.#pieces;
  }

  revert(): void {
    if (!this.#live) return;
    this.#live = false;
    this.#text.disconnect();
    this.#size?.disconnect();
    // The original nodes go back in order, before the source span, which then goes.
    for (const node of Array.from(this.#source.childNodes)) this.#element.insertBefore(node, this.#source);
    this.#source.remove();
    this.#copy?.remove();
    this.#copy = undefined;
    this.#pieces = [];
    splits.delete(this.#element);
  }

  /** Builds the copy from the original nodes, in place of the previous copy. */
  #render(): void {
    const copy = document.createElement('span');
    copy.setAttribute('data-udx-split', '');
    copy.setAttribute('aria-hidden', 'true');
    copy.style.display = this.#mode === 'lines' ? 'block' : 'inline';
    if (this.#copy) this.#copy.replaceWith(copy);
    else this.#source.after(copy);
    this.#copy = copy;
    const pieces: HTMLElement[] = [];
    for (const node of Array.from(this.#source.childNodes)) copyNode(node, copy, this.#mode, pieces);
    this.#pieces = this.#mode === 'lines' ? layOutLines(copy) : pieces;
    this.#width = contentWidth(this.#element);
  }

  /** Rebuilds the lines when the width changed, once the pieces in motion have settled. */
  #relayout(): void {
    if (!this.#live || contentWidth(this.#element) === this.#width) return;
    const running = this.#pieces.flatMap(piece => piece.getAnimations());
    if (running.length > 0) {
      if (this.#settling) return;
      this.#settling = true;
      void Promise.all(running.map(animation => animation.finished.catch(() => undefined))).then(() => {
        this.#settling = false;
        this.#relayout();
      });
      return;
    }
    this.#render();
  }
}
