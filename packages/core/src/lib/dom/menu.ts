import type { MenuInitialFocus } from '../interfaces/menu.interface.js';

const ITEM_SELECTOR = [
  '[role="menuitem"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
  '[role="option"]',
].join(',');

const isEnabled = (element: HTMLElement) =>
  !element.matches(
    ':disabled, [aria-disabled="true"], [hidden], [inert], [data-menu-disabled="true"]',
  );

const getItems = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLElement>(ITEM_SELECTOR)).filter(
    (item) =>
      isEnabled(item) &&
      item.closest('[role="menu"], [role="listbox"]') === root,
  );

export interface MenuControllerOptions {
  initialFocus?: MenuInitialFocus;
  onEscape?: () => void;
}

export interface MenuController {
  destroy(): void;
  focusFirst(): void;
  focusLast(): void;
}

/** Connects shared roving focus and type-ahead behavior for menus and listboxes. */
export function createMenuController(
  root: HTMLElement,
  { initialFocus = 'none', onEscape }: MenuControllerOptions = {},
): MenuController {
  let search = '';
  let searchTimer: ReturnType<typeof setTimeout> | undefined;
  let destroyed = false;

  const focusAt = (index: number) => {
    const items = getItems(root);
    if (!items.length) return;
    const normalized = (index + items.length) % items.length;
    items[normalized]?.focus();
  };

  const focusFirst = () => focusAt(0);
  const focusLast = () => focusAt(-1);

  const handleKeyDown = (event: KeyboardEvent) => {
    const items = getItems(root);
    if (!items.length) return;
    const currentIndex = items.indexOf(
      root.ownerDocument.activeElement as HTMLElement,
    );

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusAt(currentIndex < 0 ? 0 : currentIndex + 1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusAt(currentIndex < 0 ? -1 : currentIndex - 1);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      focusFirst();
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      focusLast();
      return;
    }
    if (event.key === 'Escape' && onEscape) {
      event.preventDefault();
      event.stopPropagation();
      onEscape();
      return;
    }
    if (
      event.key.length !== 1 ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey
    ) {
      return;
    }

    search += event.key.toLocaleLowerCase();
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      search = '';
    }, 500);

    const start = currentIndex < 0 ? 0 : currentIndex + 1;
    const ordered = [...items.slice(start), ...items.slice(0, start)];
    ordered
      .find((item) =>
        item.textContent?.trim().toLocaleLowerCase().startsWith(search),
      )
      ?.focus();
  };

  root.addEventListener('keydown', handleKeyDown);

  if (initialFocus !== 'none') {
    queueMicrotask(() => {
      if (destroyed) return;
      if (initialFocus === 'first') focusFirst();
      else focusLast();
    });
  }

  return {
    destroy() {
      destroyed = true;
      if (searchTimer) clearTimeout(searchTimer);
      root.removeEventListener('keydown', handleKeyDown);
    },
    focusFirst,
    focusLast,
  };
}

export interface ContextMenuControllerOptions {
  root: HTMLElement;
  trigger: HTMLElement;
  menu: HTMLElement;
  onDismiss: () => void;
}

/** Connects focus restoration and outside dismissal for a context menu popup. */
export function createContextMenuController({
  root,
  trigger,
  menu,
  onDismiss,
}: ContextMenuControllerOptions): { destroy(): void } {
  const ownerDocument = root.ownerDocument;
  let destroyed = false;
  queueMicrotask(() => {
    if (!destroyed) getItems(menu)[0]?.focus();
  });

  const handlePointerDown = (event: Event) => {
    if (root.contains(event.target as Node)) return;
    onDismiss();
  };
  const handleScroll = () => onDismiss();
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !menu.contains(event.target as Node)) return;
    event.preventDefault();
    event.stopPropagation();
    onDismiss();
    queueMicrotask(() => trigger.focus());
  };

  ownerDocument.addEventListener('pointerdown', handlePointerDown, true);
  ownerDocument.addEventListener('scroll', handleScroll, true);
  ownerDocument.addEventListener('keydown', handleKeyDown, true);

  return {
    destroy() {
      destroyed = true;
      ownerDocument.removeEventListener('pointerdown', handlePointerDown, true);
      ownerDocument.removeEventListener('scroll', handleScroll, true);
      ownerDocument.removeEventListener('keydown', handleKeyDown, true);
    },
  };
}
