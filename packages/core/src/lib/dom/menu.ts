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

let nextMenuId = 0;

function ensureMenuIdentity(root: HTMLElement): void {
  if (!root.dataset['menuId']) {
    root.dataset['menuId'] = `udx-menu-${nextMenuId++}`;
  }
  if (!root.dataset['menuRootId']) {
    const inheritedRoot = root.parentElement?.closest<HTMLElement>(
      '[data-menu-root-id]',
    )?.dataset['menuRootId'];
    root.dataset['menuRootId'] = inheritedRoot ?? root.dataset['menuId'] ?? '';
  }
}

function syncLeadingIconSlots(root: HTMLElement): void {
  if (root.getAttribute('role') !== 'menu') return;
  const hasActionIcon = Array.from(
    root.querySelectorAll<HTMLElement>('[data-menu-leading-icon]'),
  ).some((item) => item.closest('[role="menu"], [role="listbox"]') === root);
  root
    .querySelectorAll<HTMLElement>('[data-menu-leading-icon-slot]')
    .forEach((slot) => {
      if (slot.closest('[role="menu"], [role="listbox"]') !== root) return;
      slot.style.display = hasActionIcon ? '' : 'none';
    });
}

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
  ensureMenuIdentity(root);
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
  syncLeadingIconSlots(root);
  const leadingIconObserver =
    typeof MutationObserver === 'undefined'
      ? undefined
      : new MutationObserver(() => syncLeadingIconSlots(root));
  leadingIconObserver?.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['data-menu-leading-icon'],
  });

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
      leadingIconObserver?.disconnect();
    },
    focusFirst,
    focusLast,
  };
}

export interface MenuSubmenuControllerOptions {
  trigger: HTMLElement;
  menu?: HTMLElement | null;
  getMenu?: () => HTMLElement | null | undefined;
  interactionState?: { openedByHover: boolean };
  onOpen: () => void;
  onClose: () => void;
  isOpen: () => boolean;
}

/** Connects submenu pointer and keyboard behavior shared by all adapters. */
export function createMenuSubmenuController({
  trigger,
  menu,
  getMenu,
  interactionState = { openedByHover: false },
  onOpen,
  onClose,
  isOpen,
}: MenuSubmenuControllerOptions): { destroy(): void } {
  const parentMenu = trigger.closest<HTMLElement>('[role="menu"]');
  if (parentMenu && menu) {
    ensureMenuIdentity(parentMenu);
    ensureMenuIdentity(menu);
    const parentMenuId = parentMenu.dataset['menuId'] ?? '';
    menu.dataset['menuRootId'] = parentMenu.dataset['menuRootId'] ?? '';
    menu.dataset['menuParentId'] = parentMenuId;
    const ancestors =
      parentMenu.dataset['menuAncestry']?.split(' ').filter(Boolean) ?? [];
    menu.dataset['menuAncestry'] = [...ancestors, parentMenuId].join(' ');
  }

  const ownerDocument = trigger.ownerDocument;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  const currentMenu = () => getMenu?.() ?? menu;
  const isRtl = () =>
    ownerDocument.defaultView?.getComputedStyle(trigger).direction === 'rtl';

  const clearCloseTimer = () => {
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = undefined;
  };
  const close = () => {
    clearCloseTimer();
    interactionState.openedByHover = false;
    if (isOpen()) onClose();
  };
  const closeSoon = () => {
    clearCloseTimer();
    closeTimer = setTimeout(() => {
      closeTimer = undefined;
      close();
    }, 160);
  };
  const isOwnedSurface = (target: EventTarget | null) => {
    const NodeConstructor = ownerDocument.defaultView?.Node;
    const ElementConstructor = ownerDocument.defaultView?.Element;
    if (
      !NodeConstructor ||
      !ElementConstructor ||
      !(target instanceof NodeConstructor)
    ) {
      return false;
    }
    const targetElement =
      target instanceof ElementConstructor
        ? target
        : (target as Node).parentElement;
    if (!targetElement) return false;
    const activeMenu = currentMenu();
    if (trigger.contains(target) || activeMenu?.contains(target)) return true;
    const targetMenu = targetElement.closest<HTMLElement>('[role="menu"]');
    return Boolean(
      activeMenu &&
      targetMenu?.dataset['menuAncestry']
        ?.split(' ')
        .includes(activeMenu.dataset['menuId'] ?? ''),
    );
  };
  const focusFirst = () => {
    let attempts = 0;
    const focus = () => {
      if (!isOpen() || attempts++ >= 5) return;
      const activeMenu = currentMenu();
      const first = activeMenu ? getItems(activeMenu)[0] : undefined;
      if (first) {
        first.focus();
        return;
      }
      ownerDocument.defaultView?.requestAnimationFrame(focus);
    };
    ownerDocument.defaultView?.requestAnimationFrame(focus);
  };

  const handlePointerEnter = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    clearCloseTimer();
    if (!isOpen()) {
      interactionState.openedByHover = true;
      onOpen();
    }
  };
  const handlePointerLeave = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    if (isOwnedSurface(event.relatedTarget)) {
      clearCloseTimer();
      return;
    }
    closeSoon();
  };
  const handleClick = (event: MouseEvent) => {
    clearCloseTimer();
    const wasOpen = isOpen();
    const wasOpenedByHover = interactionState.openedByHover;
    if (wasOpen) {
      if (interactionState.openedByHover) {
        interactionState.openedByHover = false;
      } else {
        close();
      }
    } else {
      onOpen();
    }
    if (event.detail === 0 && (!wasOpen || wasOpenedByHover)) focusFirst();
  };
  const handleTriggerKeyDown = (event: KeyboardEvent) => {
    const openKey = isRtl() ? 'ArrowLeft' : 'ArrowRight';
    if (event.key === openKey) {
      event.preventDefault();
      event.stopPropagation();
      clearCloseTimer();
      if (!isOpen()) onOpen();
      focusFirst();
    } else if (event.key === 'Escape' && isOpen()) {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  };
  const handleMenuKeyDown = (event: KeyboardEvent) => {
    const closeKey = isRtl() ? 'ArrowRight' : 'ArrowLeft';
    if ((event.key === closeKey || event.key === 'Escape') && isOpen()) {
      event.preventDefault();
      event.stopPropagation();
      close();
      queueMicrotask(() => trigger.focus());
    }
  };
  const handleFocusOut = () => {
    queueMicrotask(() => {
      if (!isOwnedSurface(ownerDocument.activeElement)) close();
    });
  };
  const handlePointerDown = (event: PointerEvent) => {
    if (!isOwnedSurface(event.target)) close();
  };
  const handleItemClick = (event: MouseEvent) => {
    const target = event.target;
    const ElementConstructor = ownerDocument.defaultView?.Element;
    if (!ElementConstructor || !(target instanceof ElementConstructor)) return;
    const item = target.closest<HTMLElement>(ITEM_SELECTOR);
    if (
      currentMenu() &&
      item &&
      item.closest('[role="menu"], [role="listbox"]') === currentMenu() &&
      item.getAttribute('aria-haspopup') !== 'menu' &&
      item.getAttribute('role') !== 'menuitemcheckbox'
    ) {
      close();
    }
  };

  trigger.addEventListener('pointerenter', handlePointerEnter);
  trigger.addEventListener('pointerleave', handlePointerLeave);
  trigger.addEventListener('click', handleClick);
  trigger.addEventListener('keydown', handleTriggerKeyDown);
  trigger.addEventListener('focusout', handleFocusOut);
  menu?.addEventListener('pointerenter', handlePointerEnter);
  menu?.addEventListener('pointerleave', handlePointerLeave);
  menu?.addEventListener('keydown', handleMenuKeyDown);
  menu?.addEventListener('focusout', handleFocusOut);
  menu?.addEventListener('click', handleItemClick);
  ownerDocument.addEventListener('pointerdown', handlePointerDown, true);
  return {
    destroy() {
      clearCloseTimer();
      trigger.removeEventListener('pointerenter', handlePointerEnter);
      trigger.removeEventListener('pointerleave', handlePointerLeave);
      trigger.removeEventListener('click', handleClick);
      trigger.removeEventListener('keydown', handleTriggerKeyDown);
      trigger.removeEventListener('focusout', handleFocusOut);
      menu?.removeEventListener('pointerenter', handlePointerEnter);
      menu?.removeEventListener('pointerleave', handlePointerLeave);
      menu?.removeEventListener('keydown', handleMenuKeyDown);
      menu?.removeEventListener('focusout', handleFocusOut);
      menu?.removeEventListener('click', handleItemClick);
      ownerDocument.removeEventListener('pointerdown', handlePointerDown, true);
    },
  };
}

export interface ContextMenuControllerOptions {
  root: HTMLElement;
  trigger: HTMLElement;
  menu: HTMLElement;
  onDismiss: () => void;
}

export interface ContextMenuPoint {
  x: number;
  y: number;
}

export interface ContextMenuSize {
  width: number;
  height: number;
}

export type ContextMenuViewport = ContextMenuSize;

/**
 * Resets the native popover surface and moves the wrapper to the top layer.
 * Browsers give popovers a canvas background, border, and padding by default;
 * the nested Menu owns the visible surface instead.
 */
export function showContextMenuPopover(popup: HTMLElement): boolean {
  popup.style.backgroundColor = 'transparent';
  popup.style.borderWidth = '0';
  popup.style.borderStyle = 'none';
  popup.style.borderColor = 'transparent';
  popup.style.padding = '0';

  if (typeof popup.showPopover !== 'function') return false;
  if (!popup.matches(':popover-open')) popup.showPopover();
  return true;
}

/** Keeps a pointer-positioned context menu inside its viewport when possible. */
export function resolveContextMenuPosition(
  point: ContextMenuPoint,
  menu: ContextMenuSize,
  viewport: ContextMenuViewport,
  margin = 8,
): ContextMenuPoint {
  const minX = Math.min(margin, Math.max(0, viewport.width - menu.width));
  const minY = Math.min(margin, Math.max(0, viewport.height - menu.height));
  const maxX = Math.max(minX, viewport.width - menu.width - margin);
  const maxY = Math.max(minY, viewport.height - menu.height - margin);
  const preferredX =
    point.x + menu.width + margin <= viewport.width
      ? point.x
      : point.x - menu.width;
  const preferredY =
    point.y + menu.height + margin <= viewport.height
      ? point.y
      : point.y - menu.height;

  return {
    x: Math.min(maxX, Math.max(minX, preferredX)),
    y: Math.min(maxY, Math.max(minY, preferredY)),
  };
}

/** Connects focus restoration and outside dismissal for a context menu popup. */
export function createContextMenuController({
  root,
  trigger,
  menu,
  onDismiss,
}: ContextMenuControllerOptions): { destroy(): void } {
  const ownerDocument = root.ownerDocument;
  ensureMenuIdentity(menu);
  const rootMenuId = menu.dataset['menuRootId'];
  let destroyed = false;
  queueMicrotask(() => {
    // The fixed popup must not scroll the document when it receives initial focus.
    if (!destroyed) getItems(menu)[0]?.focus({ preventScroll: true });
  });

  const handlePointerDown = (event: Event) => {
    if (root.contains(event.target as Node)) return;
    const target = event.target;
    const ElementConstructor = ownerDocument.defaultView?.Element;
    if (ElementConstructor && target instanceof ElementConstructor) {
      const targetMenu = target.closest<HTMLElement>('[data-menu-root-id]');
      if (targetMenu?.dataset['menuRootId'] === rootMenuId) return;
    }
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
  const handleMenuClick = (event: MouseEvent) => {
    const ElementConstructor = ownerDocument.defaultView?.Element;
    if (!ElementConstructor || !(event.target instanceof ElementConstructor)) {
      return;
    }
    const item = event.target.closest<HTMLElement>(ITEM_SELECTOR);
    const itemMenu = item?.closest<HTMLElement>('[role="menu"]');
    if (
      item &&
      itemMenu?.dataset['menuRootId'] === rootMenuId &&
      item.getAttribute('aria-haspopup') !== 'menu' &&
      item.getAttribute('role') !== 'menuitemcheckbox'
    ) {
      onDismiss();
    }
  };

  ownerDocument.addEventListener('pointerdown', handlePointerDown, true);
  ownerDocument.addEventListener('scroll', handleScroll, true);
  ownerDocument.addEventListener('keydown', handleKeyDown, true);
  ownerDocument.addEventListener('click', handleMenuClick);

  return {
    destroy() {
      destroyed = true;
      ownerDocument.removeEventListener('pointerdown', handlePointerDown, true);
      ownerDocument.removeEventListener('scroll', handleScroll, true);
      ownerDocument.removeEventListener('keydown', handleKeyDown, true);
      ownerDocument.removeEventListener('click', handleMenuClick);
    },
  };
}
