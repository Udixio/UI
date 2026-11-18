/**
 * The code tabs of the root page's tiles (NeedTile.astro): one framework for the whole page and the site, stored with the
 * other examples' preference, so choosing React in one tile shows React in every tile. Tabs pattern (roving tabindex,
 * arrows, Home and End), a copy button per tile, and one polite live region (`[data-code-status]`) for the copy.
 */
import {
  EXAMPLE_FRAMEWORK_STORAGE_KEY,
  EXAMPLE_FRAMEWORKS,
  setPreferredExampleFramework,
  type ExampleFramework,
} from '@/stores/exampleFrameworkStore';

const LABELS: Record<ExampleFramework, string> = { html: 'HTML', react: 'React', angular: 'Angular', svelte: 'Svelte' };

function isFramework(value: unknown): value is ExampleFramework {
  return (EXAMPLE_FRAMEWORKS as readonly unknown[]).includes(value);
}

function storedFramework(): ExampleFramework | undefined {
  try {
    const value = window.localStorage.getItem(EXAMPLE_FRAMEWORK_STORAGE_KEY);
    return isFramework(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Shows `framework` in every tile that has it. Each tile's indicator moves in the same task as its tabs change, so the
 * old and the new indicator morph as one (shared element).
 */
export function showFramework(framework: ExampleFramework): void {
  for (const group of document.querySelectorAll<HTMLElement>('[data-code-tabs]')) {
    const tabs = [...group.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    if (!tabs.some((tab) => tab.dataset.framework === framework)) continue;
    for (const tab of tabs) {
      const selected = tab.dataset.framework === framework;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      const indicator = tab.querySelector<HTMLElement>('[data-motion-shared]');
      if (indicator) indicator.hidden = !selected;
    }
    for (const panel of group.querySelectorAll<HTMLElement>('[role="tabpanel"]')) {
      panel.hidden = panel.dataset.framework !== framework;
    }
    group.querySelector('[data-code-copy]')?.setAttribute('aria-label', `Copy ${LABELS[framework]} code`);
  }
}

let teardown: (() => void) | undefined;

function setup(): void {
  const groups = [...document.querySelectorAll<HTMLElement>('[data-code-tabs]')];
  if (groups.length === 0) return;
  const status = document.querySelector<HTMLElement>('[data-code-status]');
  const timers = new Set<number>();

  const stored = storedFramework();
  if (stored) showFramework(stored);

  function choose(framework: ExampleFramework): void {
    showFramework(framework);
    setPreferredExampleFramework(framework);
  }

  function announce(message: string): void {
    if (!status) return;
    // The same message twice in a row is announced again: the region is emptied first.
    status.textContent = '';
    window.requestAnimationFrame(() => (status.textContent = message));
  }

  async function copy(group: HTMLElement, button: HTMLButtonElement): Promise<void> {
    const panel = group.querySelector<HTMLElement>('[role="tabpanel"]:not([hidden])');
    const code = panel?.querySelector('pre')?.textContent ?? '';
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      announce('The code could not be copied: select it instead.');
      return;
    }
    announce('Code copied');
    const [copyIcon, doneIcon] = button.querySelectorAll<HTMLElement>('[data-icon]');
    button.dataset.copied = '';
    copyIcon.hidden = true;
    doneIcon.hidden = false;
    const timer = window.setTimeout(() => {
      timers.delete(timer);
      delete button.dataset.copied;
      copyIcon.hidden = false;
      doneIcon.hidden = true;
    }, 1600);
    timers.add(timer);
  }

  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    const group = target?.closest<HTMLElement>('[data-code-tabs]');
    if (!target || !group) return;
    const tab = target.closest<HTMLButtonElement>('[role="tab"]');
    if (tab && isFramework(tab.dataset.framework)) {
      choose(tab.dataset.framework);
      return;
    }
    const button = target.closest<HTMLButtonElement>('[data-code-copy]');
    if (button) void copy(group, button);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const tab = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[role="tab"]') : null;
    const tabs = tab ? [...tab.parentElement!.querySelectorAll<HTMLButtonElement>('[role="tab"]')] : [];
    const index = tab ? tabs.indexOf(tab) : -1;
    if (index < 0) return;
    const nextIndex = {
      ArrowRight: (index + 1) % tabs.length,
      ArrowLeft: (index - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }[event.key];
    if (nextIndex === undefined) return;
    event.preventDefault();
    const next = tabs[nextIndex];
    if (isFramework(next.dataset.framework)) choose(next.dataset.framework);
    next.focus();
  };

  for (const group of groups) {
    group.addEventListener('click', onClick);
    group.addEventListener('keydown', onKeyDown);
  }

  teardown = () => {
    for (const group of groups) {
      group.removeEventListener('click', onClick);
      group.removeEventListener('keydown', onKeyDown);
    }
    for (const timer of timers) window.clearTimeout(timer);
  };
}

document.addEventListener('astro:page-load', () => {
  teardown?.();
  teardown = undefined;
  setup();
});
document.addEventListener('astro:before-swap', () => {
  teardown?.();
  teardown = undefined;
});
