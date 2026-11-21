/**
 * The framework of the root page, chosen once for the site and stored with the other examples' preference: the code tabs
 * of the principle (`[data-code-tabs]`: tabs pattern with roving tabindex, arrows, Home and End; below 560 px a select,
 * `[data-code-select]`), and every `[data-framework-variant]` of the page (the install command, the live result) follow
 * it. The copy buttons (`[data-code-copy]`) copy by themselves, and name themselves after the choice (CopyButton.astro).
 */
import { showChosenFramework } from '@/lib/framework-choice';
import {
  EXAMPLE_FRAMEWORK_STORAGE_KEY,
  EXAMPLE_FRAMEWORKS,
  setPreferredExampleFramework,
  type ExampleFramework,
} from '@/stores/exampleFrameworkStore';

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

/** Shows `framework` everywhere on the page: the tabs, their panels, the select and the variants. */
export function showFramework(framework: ExampleFramework): void {
  for (const group of document.querySelectorAll<HTMLElement>('[data-code-tabs]')) {
    for (const tab of group.querySelectorAll<HTMLButtonElement>('[role="tab"]')) {
      const selected = tab.dataset.framework === framework;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      // The indicator moves in the same task as the tabs change, so the old and the new one morph as one (shared key).
      const indicator = tab.querySelector<HTMLElement>('[data-motion-shared]');
      if (indicator) indicator.hidden = !selected;
    }
    for (const panel of group.querySelectorAll<HTMLElement>('[role="tabpanel"]')) {
      panel.hidden = panel.dataset.framework !== framework;
    }
    const select = group.querySelector<HTMLSelectElement>('[data-code-select]');
    if (select) select.value = framework;
  }
  // The variants and the root attribute follow the site-wide contract (lib/framework-choice.ts).
  showChosenFramework(framework);
}

let teardown: (() => void) | undefined;

function setup(): void {
  if (!document.querySelector('[data-code-tabs], [data-framework-variant]')) return;
  const stored = storedFramework();
  if (stored) showFramework(stored);

  function choose(framework: ExampleFramework): void {
    showFramework(framework);
    setPreferredExampleFramework(framework);
  }

  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const tab = target.closest<HTMLButtonElement>('[data-code-tabs] [role="tab"]');
    if (tab && isFramework(tab.dataset.framework)) choose(tab.dataset.framework);
  };

  const onChange = (event: Event) => {
    const select = event.target instanceof HTMLSelectElement ? event.target : null;
    if (!select?.matches('[data-code-select]') || !isFramework(select.value)) return;
    choose(select.value);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const tab = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-code-tabs] [role="tab"]') : null;
    if (!tab) return;
    const tabs = [...tab.parentElement!.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    const index = tabs.indexOf(tab);
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

  document.addEventListener('click', onClick);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('change', onChange);

  teardown = () => {
    document.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('change', onChange);
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
