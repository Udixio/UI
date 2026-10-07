import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { ContextMenu, MenuItem } from '../lib/index.js';

describe('ContextMenu', () => {
  let originalShowPopoverDescriptor: PropertyDescriptor | undefined;

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalShowPopoverDescriptor) {
      Object.defineProperty(
        HTMLElement.prototype,
        'showPopover',
        originalShowPopoverDescriptor,
      );
    } else {
      delete (
        HTMLElement.prototype as HTMLElement & { showPopover?: () => void }
      ).showPopover;
    }
    originalShowPopoverDescriptor = undefined;
  });

  it('opens at the pointer within the viewport without scrolling away the trigger', async () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(800);
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(600);
    let pageScrollY = 320;
    vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => pageScrollY);

    const originalGetBoundingClientRect =
      HTMLElement.prototype.getBoundingClientRect;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: HTMLElement) {
        if (this.getAttribute('role') === 'menu') {
          return {
            x: 0,
            y: 0,
            left: 0,
            top: 0,
            right: 200,
            bottom: 120,
            width: 200,
            height: 120,
            toJSON: () => ({}),
          } as DOMRect;
        }
        return originalGetBoundingClientRect.call(this);
      },
    );

    const originalFocus = HTMLElement.prototype.focus;
    const focusSpy = vi
      .spyOn(HTMLElement.prototype, 'focus')
      .mockImplementation(function (this: HTMLElement, options?: FocusOptions) {
        // Model browsers scrolling the page when focus is not prevented.
        if (!options?.preventScroll) {
          pageScrollY = 0;
          document.dispatchEvent(new Event('scroll'));
        }
        originalFocus.call(this, options);
      });
    originalShowPopoverDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'showPopover',
    );
    const openPopovers = new WeakSet<Element>();
    const originalMatches = HTMLElement.prototype.matches;
    vi.spyOn(HTMLElement.prototype, 'matches').mockImplementation(function (
      this: HTMLElement,
      selector: string,
    ) {
      if (selector === ':popover-open') return openPopovers.has(this);
      return originalMatches.call(this, selector);
    });
    const showPopover = vi.fn(function (this: HTMLElement) {
      openPopovers.add(this);
    });
    Object.defineProperty(HTMLElement.prototype, 'showPopover', {
      configurable: true,
      value: showPopover,
    });
    render(
      <ContextMenu
        accessibleLabel="Document actions"
        trigger={<button type="button">Document</button>}
      >
        <MenuItem label="Rename" />
      </ContextMenu>,
    );
    const trigger = screen.getByRole('button', { name: 'Document' });
    fireEvent.contextMenu(trigger, { clientX: 790, clientY: 590 });

    const menu = await screen.findByRole('menu');
    const firstItem = screen.getByRole('menuitem', { name: 'Rename' });
    await waitFor(() =>
      expect(firstItem).toHaveFocus(),
    );

    expect(menu.parentElement).toHaveStyle({ left: '590px', top: '470px' });
    expect(menu.parentElement).toHaveAttribute('popover', 'manual');
    expect(menu.parentElement).toHaveClass('rounded-lg');
    const popup = menu.parentElement as HTMLElement;
    expect(popup.style.backgroundColor).toBe('transparent');
    expect(popup.style.borderWidth).toBe('0px');
    expect(popup.style.borderStyle).toBe('none');
    expect(popup.style.borderColor).toBe('transparent');
    expect(popup.style.padding).toBe('0px');
    expect(showPopover).toHaveBeenCalledOnce();
    expect(openPopovers.has(menu.parentElement as HTMLElement)).toBe(true);
    expect(menu).toBeVisible();
    expect(firstItem).toHaveClass('rounded-lg');
    expect(trigger).toBeVisible();
    expect(window.scrollY).toBe(320);
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
  });
});
