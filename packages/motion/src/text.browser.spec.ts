import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSplit, splitText, type SplitBy, type TextSplit } from './text.js';

let host: HTMLElement;
let splits: TextSplit[];

beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
  splits = [];
});

afterEach(() => {
  for (const split of splits) split.revert();
  host.remove();
  vi.restoreAllMocks();
});

/** A paragraph of the test page with the given markup and style. */
function paragraph(html: string, style = ''): HTMLParagraphElement {
  const p = document.createElement('p');
  p.innerHTML = html;
  p.style.cssText = `margin:0;${style}`;
  host.append(p);
  return p;
}

/** Splits an element, and keeps the split for the cleanup. */
function cut(element: HTMLElement, by: SplitBy): TextSplit {
  const split = splitText(element, { by });
  if (!split) throw new Error('the text was not split');
  splits.push(split);
  return split;
}

const textsOf = (pieces: readonly HTMLElement[]) => pieces.map(piece => piece.textContent);

/** Resolves at the next resize observation of an element: our own observer answers first, it was created first. */
function nextResize(element: HTMLElement): Promise<void> {
  return new Promise(resolve => {
    const observer = new ResizeObserver(() => {
      observer.disconnect();
      resolve();
    });
    observer.observe(element);
  });
}

/** Lets the mutation observers deliver their records: they run before any timer. */
const deliverMutations = () => new Promise(resolve => setTimeout(resolve, 0));

describe('words', () => {
  it('cuts the text into words, with the punctuation that touches them', () => {
    const p = paragraph('Hello, big world!');
    expect(textsOf(cut(p, 'words').pieces)).toEqual(['Hello,', 'big', 'world!']);
  });

  it('keeps the spaces as plain text between the inline-block pieces', () => {
    const p = paragraph('Hello, big world!');
    const { pieces } = cut(p, 'words');
    for (const piece of pieces) expect(getComputedStyle(piece).display).toBe('inline-block');
    expect(pieces[0].nextSibling?.nodeValue).toBe(' ');
    expect(p.querySelector<HTMLElement>('[data-udx-split]')?.textContent).toBe('Hello, big world!');
  });
});

describe('chars', () => {
  it('cuts the text into graphemes, and no space is a piece', () => {
    const p = paragraph('Où ça 👍🏽');
    const { pieces } = cut(p, 'chars');
    expect(textsOf(pieces)).toEqual(['O', 'ù', 'ç', 'a', '👍🏽']);
  });

  it('cuts an Arabic text in words, not letters', () => {
    const p = paragraph('مرحبا بالعالم');
    p.lang = 'ar';
    expect(textsOf(cut(p, 'chars').pieces)).toEqual(['مرحبا', 'بالعالم']);
  });

  it('keeps Chinese, Japanese and Korean letters as letters', () => {
    const p = paragraph('中文 한국');
    expect(textsOf(cut(p, 'chars').pieces)).toEqual(['中', '文', '한', '국']);
  });
});

describe('lines', () => {
  it('cuts the text into its lines, and a wider box gives fewer', async () => {
    const p = paragraph('aaaaaaaa bbbbbbbb cccccccc', 'width:120px;font:20px/24px monospace');
    const split = cut(p, 'lines');
    expect(textsOf(split.pieces)).toEqual(['aaaaaaaa', 'bbbbbbbb', 'cccccccc']);
    expect(split.pieces.every(piece => getComputedStyle(piece).display === 'block')).toBe(true);
    p.style.width = '240px';
    await nextResize(p);
    expect(textsOf(split.pieces)).toEqual(['aaaaaaaa bbbbbbbb', 'cccccccc']);
    expect(split.pieces.map(piece => piece.textContent).join(' ')).toBe('aaaaaaaa bbbbbbbb cccccccc');
  });

  it('falls back to words when the text holds an inline element, and says so', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const p = paragraph('Read <em>this</em> now', 'width:120px');
    const { pieces } = cut(p, 'lines');
    expect(textsOf(pieces)).toEqual(['Read', 'this', 'now']);
    expect(pieces.every(piece => getComputedStyle(piece).display === 'inline-block')).toBe(true);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[@udixio/motion]'));
  });
});

describe('accessibility', () => {
  it('keeps the original nodes in a visually hidden source, and the copy hidden from assistive technology', () => {
    const p = paragraph('Read <em>this</em> <abbr title="Hypertext">HTML</abbr>');
    const em = p.querySelector('em');
    const abbr = p.querySelector('abbr');
    if (!em || !abbr) throw new Error('the markup is missing');
    const { pieces } = cut(p, 'words');
    const source = p.querySelector<HTMLElement>('[data-udx-split-source]');
    const copy = p.querySelector<HTMLElement>('[data-udx-split]');
    if (!source || !copy) throw new Error('the split has no source or no copy');
    expect(source.contains(em)).toBe(true);
    expect(source.contains(abbr)).toBe(true);
    expect(source.textContent).toBe('Read this HTML');
    expect(getComputedStyle(source).position).toBe('absolute');
    expect(source.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    expect(copy.getAttribute('aria-hidden')).toBe('true');
    expect(copy.querySelector('em')?.textContent).toBe('this');
    expect(copy.querySelector('abbr')?.getAttribute('title')).toBe('Hypertext');
    expect(pieces.every(piece => copy.contains(piece))).toBe(true);
  });

  it('gives the copy no duplicate id', () => {
    const p = paragraph('Hello <span id="greeting">big</span> world');
    cut(p, 'words');
    expect(document.querySelectorAll('#greeting')).toHaveLength(1);
    expect(p.querySelector('[data-udx-split-source] #greeting')).not.toBeNull();
  });

  it.each([
    ['a link', '<a href="#next">this link</a>'],
    ['a button', '<button>go</button>'],
    ['a focusable element', '<span tabindex="-1">focus</span>'],
  ])('does not split a text holding %s, and warns once', (_, html) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const p = paragraph(`Read ${html}`);
    const before = p.innerHTML;
    expect(splitText(p, { by: 'words' })).toBeUndefined();
    expect(splitText(p, { by: 'chars' })).toBeUndefined();
    expect(p.innerHTML).toBe(before);
    expect(getSplit(p)).toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toMatch(/^\[@udixio\/motion\]/);
  });

  it('follows the text when a framework sets the value of an original text node', async () => {
    const p = paragraph('Hello world');
    const node = p.firstChild as Text;
    const split = cut(p, 'words');
    node.nodeValue = 'Good morning';
    await deliverMutations();
    expect(textsOf(split.pieces)).toEqual(['Good', 'morning']);
    expect(p.querySelector<HTMLElement>('[data-udx-split-source]')?.contains(node)).toBe(true);
  });
});

describe('a failed split', () => {
  it('leaves the element as it was when the browser has no Intl.Segmenter, and throws', () => {
    // The segmenters are made once per language: a language that no other test uses makes this one construct its own.
    const p = paragraph('Tämä on lause, kaksi sanaa.');
    p.lang = 'fi';
    const before = p.innerHTML;
    const native = Object.getOwnPropertyDescriptor(Intl, 'Segmenter')!;
    Reflect.deleteProperty(Intl, 'Segmenter');
    try {
      expect(() => splitText(p, { by: 'chars' })).toThrow(TypeError);
    } finally {
      Object.defineProperty(Intl, 'Segmenter', native);
    }
    expect(p.innerHTML).toBe(before);
    expect(getSplit(p)).toBeUndefined();
  });
});

describe('revert', () => {
  it.each(['chars', 'words', 'lines'] as const)('puts the %s split back exactly as it was', by => {
    const p = paragraph('Read <em>this</em> now, please', 'width:120px');
    const before = p.innerHTML;
    const split = cut(p, by);
    const pieces = [...split.pieces];
    split.revert();
    expect(p.innerHTML).toBe(before);
    expect(getSplit(p)).toBeUndefined();
    expect(pieces.length).toBeGreaterThan(0);
    expect(pieces.every(piece => !piece.isConnected)).toBe(true);
  });

  it('returns the same split for the same mode, and a new one for another mode', () => {
    const p = paragraph('Hello big world');
    const first = cut(p, 'words');
    const old = [...first.pieces];
    expect(splitText(p, { by: 'words' })).toBe(first);
    const second = cut(p, 'chars');
    expect(second).not.toBe(first);
    expect(old.every(piece => !piece.isConnected)).toBe(true);
    expect(getSplit(p)).toBe(second);
  });

  it('leaves an element without text alone', () => {
    const p = paragraph('   ');
    expect(splitText(p, { by: 'words' })).toBeUndefined();
    expect(p.childNodes).toHaveLength(1);
  });
});

describe('layout', () => {
  it.each(['chars', 'words', 'lines'] as const)('keeps the box of a two-line paragraph (%s)', by => {
    const p = paragraph('aaaaaaaa bbbbbbbb cccccccc dddddddd', 'width:260px;font:20px/24px monospace');
    const before = p.getBoundingClientRect();
    expect(before.height).toBe(48);
    cut(p, by);
    const after = p.getBoundingClientRect();
    expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.width - before.width)).toBeLessThanOrEqual(1);
  });
});
