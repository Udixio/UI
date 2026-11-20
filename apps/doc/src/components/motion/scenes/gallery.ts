/**
 * The "Morph one into another" scene: six thumbnails, one of which opens into a detail that shares its key, so that the
 * shape and the colours travel from the thumbnail to the detail and back. Escape or Close returns the focus to the
 * thumbnail. Grid · List changes the layout of the thumbnails. On a need page, a tab bar (a Udixio Tabs, whose indicator
 * slides by itself) filters them by role. Markup: `Gallery.astro`; controls: `GalleryControls.tsx` (the Grid · List chips and
 * the tab bar, which render the layout and the filter this scene publishes) and `GalleryClose.tsx`. Shared by the root-page
 * tile and the hero of /motion/shared-elements.
 */
import { loadLayoutEngine } from '@udixio/motion';
import { createSceneState } from './sceneState';
import type { GalleryState } from './GalleryControls';

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
  // The tabs of the filter, in the order of the tab bar: a tab reports its index, and this is the list it indexes.
  const tabs = [...root.querySelectorAll<HTMLElement>('[data-gallery-filter]')];
  if (!detail || !panel || !shape || !name || !text || !close || thumbs.length === 0) return () => {};

  // A change made before the layout engine is loaded does not move: load it now.
  void loadLayoutEngine();
  let open: HTMLButtonElement | null = null;
  let colours = '';
  let layout: GalleryState['mode'] = 'grid';
  let role = 'all';
  const state = createSceneState<GalleryState>(root, () => ({ mode: layout, filter: role }));

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

  /** Shows the thumbnails of one role. The tab bar renders the selected tab from the state this publishes. */
  function showRole(next: string): void {
    closeThumb();
    role = next;
    for (const thumb of thumbs) thumb.hidden = role !== 'all' && thumb.dataset.galleryRole !== role;
    state.publish();
  }

  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const thumb = target.closest<HTMLButtonElement>('[data-gallery-thumb]');
    if (thumb) return openThumb(thumb);
    if (target.closest('[data-gallery-close]')) return closeThumb();
    const mode = target.closest<HTMLElement>('[data-gallery-mode]');
    if (mode) {
      layout = mode.dataset.galleryMode === 'list' ? 'list' : 'grid';
      scene.dataset.mode = layout;
      state.publish();
    }
  };

  // The tab bar reports the tab it selects, by a click or by the arrow keys, as an `input` event whose detail is its index.
  const onInput = (event: Event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target?.closest('[data-gallery-tabs]')) return;
    const tab = tabs[Number((event as CustomEvent<number>).detail)];
    if (tab) showRole(tab.dataset.galleryFilter ?? 'all');
  };

  // Escape closes the detail.
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      closeThumb();
    }
  };

  root.addEventListener('click', onClick);
  root.addEventListener('input', onInput);
  root.addEventListener('keydown', onKeyDown);

  return () => {
    root.removeEventListener('click', onClick);
    root.removeEventListener('input', onInput);
    root.removeEventListener('keydown', onKeyDown);
    state.stop();
  };
}
