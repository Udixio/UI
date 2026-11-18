/**
 * The "Count a number" scene: counters that count to each new number when they come into view, and on a press of Add
 * 1,000. The page adds a language group: changing it sets `lang` on the scene, and the numbers take that language's format
 * (a counter formats in the language of its nearest `lang` when it is bound, so each counter is bound again). Markup:
 * `Counters.astro`; controls: `CountersControls.astro`. Shared by the root-page tile and the hero of /motion/counters.
 */
import { defineValue, value, type ValueBinding } from '@udixio/motion/value';

defineValue('counter-visitors', { source: 'state', format: 'integer', range: [0, 100000] });
defineValue('counter-returning', { source: 'state', format: 'percent', range: [0, 1] });
defineValue('counter-revenue', { source: 'state', format: 'currency', currency: 'EUR', range: [0, 1000000] });
defineValue('counter-rating', { source: 'state', format: 'decimal', range: [0, 5] });

/** The share of returning visitors each press of Add 1,000 moves to, in turn. */
const SHARES = [0.42, 0.46, 0.39, 0.44];

/**
 * The format of each counter, as the library formats it: a counter written by hand (on a language change) must read as the
 * library would write it.
 */
const FORMAT: Record<string, Intl.NumberFormatOptions> = {
  'counter-visitors': { maximumFractionDigits: 0 },
  'counter-returning': { style: 'percent', maximumFractionDigits: 0 },
  'counter-revenue': { style: 'currency', currency: 'EUR' },
  'counter-rating': { minimumFractionDigits: 1, maximumFractionDigits: 1 },
};

export function mount(root: HTMLElement): () => void {
  const scene = root.querySelector<HTMLElement>('[data-counters-scene]');
  const counters = [...root.querySelectorAll<HTMLElement>('[data-counter]')];
  if (!scene || counters.length === 0) return () => {};
  const languages = [...root.querySelectorAll<HTMLButtonElement>('[data-counters-lang]')];
  const readout = root.querySelector<HTMLElement>('[data-counters-readout]');
  const visitors = counters.find((el) => el.dataset.counter === 'counter-visitors');
  const revenue = counters.find((el) => el.dataset.counter === 'counter-revenue');
  let share = 0;

  // The binding of each counter: binding a name again on an element destroys the one it replaces.
  const bindings = new Map<HTMLElement, ValueBinding>();
  const bind = (el: HTMLElement) => bindings.set(el, value(el, el.dataset.counter ?? ''));
  for (const el of counters) bind(el);

  /** Each counter is bound again in the new language, and written in it: its final number, as the library writes it. */
  function setLanguage(lang: string): void {
    scene!.setAttribute('lang', lang);
    for (const el of counters) {
      bind(el);
      const format = FORMAT[el.dataset.counter ?? ''];
      el.textContent = new Intl.NumberFormat(lang, format).format(Number(el.getAttribute('value')));
    }
    for (const button of languages) button.setAttribute('aria-pressed', String(button.dataset.countersLang === lang));
    if (readout) readout.textContent = `lang: '${lang}'`;
  }

  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest('[data-counters-add]')) {
      if (visitors) visitors.setAttribute('value', String(Number(visitors.getAttribute('value')) + 1000));
      if (revenue) revenue.setAttribute('value', String(Number(revenue.getAttribute('value')) + 1000));
      const returning = counters.find((el) => el.dataset.counter === 'counter-returning');
      if (returning) returning.setAttribute('value', String(SHARES[++share % SHARES.length]));
      return;
    }
    const language = target.closest<HTMLButtonElement>('[data-counters-lang]');
    if (language?.dataset.countersLang) setLanguage(language.dataset.countersLang);
  };
  root.addEventListener('click', onClick);

  return () => {
    root.removeEventListener('click', onClick);
    for (const binding of bindings.values()) binding.destroy();
  };
}
