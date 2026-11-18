/**
 * The "Morph one into another" scene: six thumbnails, one of which opens into a detail that shares its key, so that the
 * shape and the colours travel from the thumbnail to the detail and back. Escape or Close returns the focus to the
 * thumbnail. Grid · List changes the layout of the thumbnails. On a need page, a tab bar filters them by role; its
 * indicator is a shared element that travels between the tabs. Markup: `Gallery.astro`, controls: `GalleryControls.astro`.
 * Shared by the root-page tile and the hero of /motion/shared-elements.
 */
import { loadLayoutEngine } from '@udixio/motion';

/** The panel of the detail fills it, its content centred: the detail's corners clip its colour. Gallery.astro has the same. */
const PANEL_CLASS = 'flex size-full flex-col items-center justify-center gap-3 p-5 text-center';

export function mount(root: HTMLElement): () => void {
  const scene = root.querySelector<HTMLElement>('[data-gallery-scene]') ?? root;
  const detail = root.querySelector<HTMLElement>('[data-gallery-detail]');
  const panel = root.querySelector<HTMLElement>('[data-gallery-panel]');
  const shape = root.querySelector<SVGPathElement>('[data-gallery-detail-shape]');
  const name = root.querySelector<HTMLElement>('[data-gallery-detail-name]');
  const text = root.querySelector<HTMLElement>('[data-gallery-detail-text]');
  const close = root.querySelector<HTMLButtonElement>('[data-gallery-close]');
  const thumbs = [...root.querySelectorAll<HTMLButtonElement>('[data-gallery-thumb]')];
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[data-gallery-filter]')];
  if (!detail || !panel || !shape || !name || !text || !close || thumbs.length === 0) return () => {};

  // A change made before the layout engine is loaded does not move: load it now.
  void loadLayoutEngine();
  let open: HTMLButtonElement | null = null;
  let colours = '';

  /** The thumbnail opens into the detail: in one task, the key and the colours move, and the thumbnail is hidden. */
  function openThumb(thumb: HTMLButtonElement): void {
    if (open) closeThumb();
    open = thumb;
    const index = thumbs.indexOf(thumb);
    colours = thumb.dataset.galleryColours ?? '';
    panel!.className = `${PANEL_CLASS} ${colours}`;
    detail!.dataset.motionShared = thumb.dataset.motionShared ?? `shape-${index}`;
    shape!.setAttribute('d', thumb.querySelector('path')?.getAttribute('d') ?? '');
    name!.textContent = thumb.querySelector('[data-gallery-name]')?.textContent ?? '';
    text!.textContent = thumb.dataset.galleryText ?? '';
    thumb.hidden = true;
    detail!.hidden = false;
    thumb.setAttribute('aria-expanded', 'true');
    // The focus goes to Close once the detail is shown, as the frame after the change.
    requestAnimationFrame(() => close!.focus());
  }

  /** The detail closes: it is hidden, its thumbnail is shown again, and the focus returns to the thumbnail. */
  function closeThumb(): void {
    if (!open) return;
    const thumb = open;
    detail!.hidden = true;
    thumb.hidden = false;
    thumb.setAttribute('aria-expanded', 'false');
    thumb.focus();
    open = null;
  }

  /** Shows the thumbnails of one role, and moves the indicator of the tab bar to its tab. */
  function filter(role: string): void {
    closeThumb();
    for (const thumb of thumbs) thumb.hidden = role !== 'all' && thumb.dataset.galleryRole !== role;
    for (const tab of tabs) {
      const selected = tab.dataset.galleryFilter === role;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      const indicator = tab.querySelector<HTMLElement>('[data-gallery-indicator]');
      if (indicator) indicator.hidden = !selected;
    }
  }

  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const thumb = target.closest<HTMLButtonElement>('[data-gallery-thumb]');
    if (thumb) return openThumb(thumb);
    if (target.closest('[data-gallery-close]')) return closeThumb();
    const tab = target.closest<HTMLButtonElement>('[data-gallery-filter]');
    if (tab) return filter(tab.dataset.galleryFilter ?? 'all');
    const mode = target.closest<HTMLButtonElement>('[data-gallery-mode]');
    if (mode) {
      scene.dataset.mode = mode.dataset.galleryMode ?? 'grid';
      for (const button of root.querySelectorAll<HTMLButtonElement>('[data-gallery-mode]')) {
        button.setAttribute('aria-pressed', String(button === mode));
      }
    }
  };

  // Escape closes the detail; the arrow keys move between the tabs of the filter, and select the tab they reach.
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      closeThumb();
      return;
    }
    const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-gallery-filter]') : null;
    if (!target) return;
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const next = tabs[(tabs.indexOf(target) + step + tabs.length) % tabs.length];
    next.focus();
    filter(next.dataset.galleryFilter ?? 'all');
  };

  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKeyDown);

  return () => {
    root.removeEventListener('click', onClick);
    root.removeEventListener('keydown', onKeyDown);
  };
}
