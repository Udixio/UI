import { resolveWaapiTiming } from '@udixio/motion';
import { compile } from 'tailwindcss';
import { afterEach, describe, expect, it } from 'vitest';
import { sideSheetStyle } from '../styles/side-sheet.style.js';
import {
  createSideSheetTransitionController,
  type SideSheetTransitionController,
} from './side-sheet.js';

/** A container that sizes to its 300 px content when its width is `auto`, and a backdrop. */
function mountSheet() {
  document.body.innerHTML = `
    <div id="container" style="display: inline-block; overflow: hidden; vertical-align: top">
      <div style="width: 300px; height: 40px"></div>
    </div>
    <div id="overlay" style="position: fixed; inset: 0; opacity: 0"></div>
  `;
  return {
    container: document.querySelector<HTMLElement>('#container')!,
    overlay: document.querySelector<HTMLElement>('#overlay')!,
  };
}

const widthOf = (element: Element) => parseFloat(getComputedStyle(element).width);
const opacityOf = (element: Element) => parseFloat(getComputedStyle(element).opacity);

/** The duration in ms that a motion token plays with in this document (expressive scheme). */
const tokenDuration = (element: HTMLElement, timing: Parameters<typeof resolveWaapiTiming>[1]) =>
  resolveWaapiTiming(element, timing, 'expressive')!.duration;

/** Freezes every animation of an element at the given fraction of its duration. */
function freezeAt(element: Element, fraction: number) {
  for (const animation of element.getAnimations()) {
    animation.pause();
    animation.currentTime = Number(animation.effect!.getComputedTiming().duration) * fraction;
  }
}

/** Resolves once every animation of the given elements has finished, without a cancelled one. */
const settle = (...elements: Element[]) =>
  Promise.all(elements.flatMap((element) => element.getAnimations().map((animation) => animation.finished)));

describe('createSideSheetTransitionController in the browser', () => {
  let controller: SideSheetTransitionController | undefined;

  afterEach(() => {
    controller?.destroy();
    controller = undefined;
    document.documentElement.removeAttribute('data-motion-policy');
    document.body.innerHTML = '';
  });

  it('opens to the width of its content, then hands the width back to the content', async () => {
    const { container, overlay } = mountSheet();
    controller = createSideSheetTransitionController({ container, overlay });

    controller.setOpen(false, true);
    controller.setOpen(true);

    const [slide] = container.getAnimations();
    expect(slide!.effect!.getComputedTiming().duration).toBe(
      tokenDuration(container, 'spring.default.spatial'),
    );
    await settle(container, overlay);

    expect(container.style.width).toBe('');
    expect(widthOf(container)).toBeCloseTo(300, 0);
    expect(overlay.style.opacity).toBe('1');
    expect(opacityOf(overlay)).toBe(1);
  });

  it('closes to a zero width and fades the backdrop out', async () => {
    const { container, overlay } = mountSheet();
    controller = createSideSheetTransitionController({ container, overlay });

    controller.setOpen(true, true);
    controller.setOpen(false);
    await settle(container, overlay);

    expect(container.style.width).toBe('0px');
    expect(widthOf(container)).toBeCloseTo(0, 0);
    expect(opacityOf(overlay)).toBe(0);
  });

  it('plays the backdrop fade on the effects spring, not on the width timing', () => {
    const { container, overlay } = mountSheet();
    controller = createSideSheetTransitionController({ container, overlay });

    controller.setOpen(true);

    const [fade] = overlay.getAnimations();
    expect(fade!.effect!.getComputedTiming().duration).toBe(
      tokenDuration(overlay, 'spring.default.effects'),
    );
  });

  it('continues from the width it shows when the sheet reverses mid-way', () => {
    const { container, overlay } = mountSheet();
    controller = createSideSheetTransitionController({ container, overlay });

    controller.setOpen(true, true);
    controller.setOpen(false);
    freezeAt(container, 0.25);
    const shown = widthOf(container);
    expect(shown).toBeGreaterThan(1);
    expect(shown).toBeLessThan(299);

    controller.setOpen(true);
    const [reverse] = container.getAnimations();
    const [first] = (reverse!.effect as KeyframeEffect).getKeyframes();
    expect(Math.abs(parseFloat(String(first!.width)) - shown)).toBeLessThanOrEqual(1);
  });

  it('applies the end state at once for an instant sync, with no animation', () => {
    const { container, overlay } = mountSheet();
    controller = createSideSheetTransitionController({ container, overlay });

    controller.setOpen(false, true);

    expect(container.getAnimations()).toHaveLength(0);
    expect(container.style.width).toBe('0px');
    expect(overlay.style.opacity).toBe('0');
  });

  it('applies the end state at once under the document reduced motion policy', () => {
    document.documentElement.setAttribute('data-motion-policy', 'reduce');
    const { container, overlay } = mountSheet();
    controller = createSideSheetTransitionController({ container, overlay });

    controller.setOpen(true);

    expect(container.getAnimations()).toHaveLength(0);
    expect(container.style.width).toBe('');
    expect(overlay.style.opacity).toBe('1');
  });

  it('applies the end state at once when the reducedMotion option says so', () => {
    const { container, overlay } = mountSheet();
    controller = createSideSheetTransitionController({
      container,
      overlay,
      reducedMotion: () => true,
    });

    controller.setOpen(true);

    expect(container.getAnimations()).toHaveLength(0);
    expect(container.style.width).toBe('');
  });

  it('plays the timing option for the width', () => {
    const { container, overlay } = mountSheet();
    controller = createSideSheetTransitionController({
      container,
      overlay,
      timing: { duration: 'duration.long1', easing: 'easing.standard' },
    });

    controller.setOpen(false, true);
    controller.setOpen(true);

    const [slide] = container.getAnimations();
    expect(slide!.effect!.getComputedTiming().duration).toBe(450);
    expect((slide!.effect as KeyframeEffect).getTiming().easing).toBe('cubic-bezier(0.2, 0, 0, 1)');
  });

  it('cancels the running width and backdrop motions on destroy', () => {
    const { container, overlay } = mountSheet();
    controller = createSideSheetTransitionController({ container, overlay });

    controller.setOpen(false, true);
    controller.setOpen(true);
    expect(container.getAnimations()).toHaveLength(1);
    expect(overlay.getAnimations()).toHaveLength(1);

    controller.destroy();
    controller = undefined;

    expect(container.getAnimations()).toHaveLength(0);
    expect(overlay.getAnimations()).toHaveLength(0);
  });
});

/** The classes an adapter renders for a sheet: the core style merged with the author's className, as every adapter merges them. */
function sheetClasses(variant: 'modal' | 'standard', className?: string) {
  return sideSheetStyle({
    variant,
    position: 'right',
    isOpen: false,
    className,
  } as Parameters<typeof sideSheetStyle>[0]);
}

/**
 * The theme scales the sheet and its author classes read: the spacing scale (`w-96`, `p-4`), the `xs` container (`max-w-xs`)
 * and the `sm` breakpoint. Without them Tailwind generates no class for those names, and the test would prove nothing.
 */
const SHEET_THEME = `@theme {
  --spacing: 0.25rem;
  --container-xs: 20rem;
  --breakpoint-sm: 40rem;
}
@tailwind utilities;`;

/** Compiles the utilities of the given classes, so that the layout and the stacking of a mounted sheet are the real ones. */
async function compileUtilities(classes: string[]): Promise<HTMLStyleElement> {
  const compiler = await compile(SHEET_THEME);
  const style = document.createElement('style');
  style.textContent = compiler.build([...new Set(classes)]);
  document.head.append(style);
  return style;
}

/**
 * A modal sheet as the adapters mount it: the backdrop, then the panel that carries the sheet and author classes and wraps
 * the content. With `chrome`, a full-screen layer at z-20 stands for the page chrome (the documentation's sticky rail is z-20).
 */
function mountModal(className: string, chrome = false) {
  const classes = sheetClasses('modal', className);
  document.body.innerHTML = `
    ${chrome ? '<div id="chrome" style="position: fixed; inset: 0; z-index: 20"></div>' : ''}
    <div id="overlay" class="${classes.overlay}"></div>
    <div id="panel" class="${classes.sideSheet}">
      <div class="${classes.container}"><div style="width: 300px; height: 40px"></div></div>
    </div>
  `;
  return {
    panel: document.querySelector<HTMLElement>('#panel')!,
    overlay: document.querySelector<HTMLElement>('#overlay')!,
    candidates: Object.values(classes)
      .flatMap((value) => value.split(/\s+/))
      .filter(Boolean),
  };
}

/** The element at the centre of a rectangle, as the pointer would reach it. */
const hitAtCentre = (element: Element) => {
  const { left, top, width, height } = element.getBoundingClientRect();
  return document.elementFromPoint(left + width / 2, top + height / 2);
};

/** Resolves once the motions of the given elements have settled, and the handlers that end them have run. */
const settled = async (...elements: Element[]) => {
  await settle(...elements);
  await new Promise((resolve) => setTimeout(resolve, 0));
};

describe('a modal side sheet with the classes its author gives it, in the browser', () => {
  let controller: SideSheetTransitionController | undefined;
  let style: HTMLStyleElement | undefined;

  afterEach(() => {
    controller?.destroy();
    controller = undefined;
    style?.remove();
    style = undefined;
    document.body.innerHTML = '';
  });

  it.each(['w-96 max-w-none', 'w-[calc(100vw-2rem)] max-w-none sm:w-96'])(
    'closes to a zero width under the width classes %s',
    async (className) => {
      const { panel, overlay, candidates } = mountModal(className);
      style = await compileUtilities(candidates);
      controller = createSideSheetTransitionController({
        container: panel,
        overlay,
      });

      controller.setOpen(true, true);
      controller.setOpen(false);
      await settled(panel, overlay);

      expect(panel.getBoundingClientRect().width).toBe(0);
    },
  );

  it('closes to a zero width under a minimum width class, which a closed sheet does not keep', async () => {
    const { panel, overlay, candidates } = mountModal('min-w-96 max-w-none');
    style = await compileUtilities(candidates);
    controller = createSideSheetTransitionController({
      container: panel,
      overlay,
    });

    controller.setOpen(true, true);
    controller.setOpen(false);
    await settled(panel, overlay);

    expect(panel.getBoundingClientRect().width).toBe(0);
  });

  it('hides a closed panel whose padding would keep a sliver of it painted', async () => {
    const { panel, overlay, candidates } = mountModal('p-4 max-w-none');
    style = await compileUtilities(candidates);
    controller = createSideSheetTransitionController({
      container: panel,
      overlay,
    });

    controller.setOpen(true, true);
    controller.setOpen(false);
    await settled(panel, overlay);

    expect(getComputedStyle(panel).visibility).toBe('hidden');
  });

  it('keeps the panel visible while it closes, then hides it once the exit has finished', async () => {
    const { panel, overlay, candidates } = mountModal('w-96 max-w-none');
    style = await compileUtilities(candidates);
    controller = createSideSheetTransitionController({
      container: panel,
      overlay,
    });

    controller.setOpen(true, true);
    controller.setOpen(false);
    expect(getComputedStyle(panel).visibility).toBe('visible');

    await settled(panel, overlay);
    expect(getComputedStyle(panel).visibility).toBe('hidden');
  });

  it('shows a panel that reopens in the middle of its exit at once, and keeps it shown', async () => {
    const { panel, overlay, candidates } = mountModal('w-96 max-w-none');
    style = await compileUtilities(candidates);
    controller = createSideSheetTransitionController({
      container: panel,
      overlay,
    });

    controller.setOpen(true, true);
    controller.setOpen(false);
    freezeAt(panel, 0.5);
    controller.setOpen(true);
    expect(getComputedStyle(panel).visibility).toBe('visible');

    await settled(panel, overlay);
    expect(getComputedStyle(panel).visibility).toBe('visible');
    expect(panel.style.width).toBe('');
    expect(panel.getBoundingClientRect().width).toBeGreaterThan(0);
  });

  it('applies the closed state at once for an instant sync: zero width, hidden', () => {
    const { panel, overlay } = mountModal('w-96 max-w-none');
    controller = createSideSheetTransitionController({
      container: panel,
      overlay,
    });

    controller.setOpen(false, true);

    expect(getComputedStyle(panel).visibility).toBe('hidden');
    expect(panel.getBoundingClientRect().width).toBe(0);
  });

  it('paints the open panel above page chrome that sits at z-20', async () => {
    const { panel, overlay, candidates } = mountModal('w-96 max-w-none', true);
    style = await compileUtilities(candidates);
    controller = createSideSheetTransitionController({
      container: panel,
      overlay,
    });

    controller.setOpen(true, true);

    expect(panel.contains(hitAtCentre(panel))).toBe(true);
  });

  it('paints the open backdrop above page chrome that sits at z-20, so the chrome is dimmed too', async () => {
    const { panel, overlay, candidates } = mountModal('w-96 max-w-none', true);
    style = await compileUtilities(candidates);
    controller = createSideSheetTransitionController({
      container: panel,
      overlay,
    });

    controller.setOpen(true, true);

    expect(document.elementFromPoint(5, 5)).toBe(overlay);
  });
});
