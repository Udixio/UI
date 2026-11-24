/**
 * Steps B and E (review 5, Q3). B: a component that animates its own element holds that kind there (`reserveMotion`, in its
 * shared controller), so `udxMotion` of that kind on it is ignored, and development names the component. E: a host whose
 * component shows its surface in a portal or the top layer is marked `data-motion-box="none"`: nothing binds, and development
 * points to the component's own motion input.
 */
import '@udixio/motion/presets';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { getMotion, getMotions, motion } from '@udixio/motion';
import { AnchorPositioner } from '../anchor-positioner/anchor-positioner';
import { ContextMenu } from '../context-menu/context-menu';
import { MenuItem } from '../menu/menu-item';
import { SideSheet } from '../side-sheet/side-sheet';
import { Snackbar } from '../snackbar/snackbar';
import { Motion } from './motion';

@Component({
  standalone: true,
  imports: [Snackbar, Motion],
  template: `<udx-snackbar udxMotion="fade press" message="Saved" />`,
})
class SnackbarHost {}

@Component({
  standalone: true,
  imports: [SideSheet, Motion],
  template: `<udx-side-sheet udxMotion="fade" title="Filters">Body</udx-side-sheet>`,
})
class SideSheetHost {}

@Component({
  standalone: true,
  imports: [ContextMenu, MenuItem],
  template: `
    <udx-context-menu accessibleLabel="Document actions">
      <button contextMenuTrigger type="button">Document</button>
      <udx-menu-item label="Rename" />
    </udx-context-menu>
  `,
})
class ContextMenuHost {}

@Component({
  standalone: true,
  imports: [AnchorPositioner, ContextMenu, MenuItem, SideSheet, Motion],
  template: `
    <button #anchor type="button">Anchor</button>
    <udx-side-sheet udxMotion="fade" variant="modal" title="Filters">Body</udx-side-sheet>
    <udx-anchor-positioner udxMotion="fade" [anchor]="anchor">Panel</udx-anchor-positioner>
    <udx-context-menu udxMotion="press" accessibleLabel="Actions">
      <button contextMenuTrigger type="button">Doc</button>
      <udx-menu-item label="Rename" />
    </udx-context-menu>
  `,
})
class NoBoxHosts {}

/** The development messages of a console spy that contain `text`. */
const reported = (spy: jest.SpyInstance, text: string): string[] =>
  spy.mock.calls.map(([message]) => String(message)).filter((message) => message.includes(text));

describe('a Udixio component holds the kinds it animates (step B)', () => {
  let error: jest.SpyInstance;
  beforeEach(() => {
    error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => error.mockRestore());

  it('udx-snackbar: a presence on it is ignored, the host carries no presence, development names Snackbar; an emphasis binds', () => {
    const fixture = TestBed.createComponent(SnackbarHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('udx-snackbar') as HTMLElement;
    const panel = host.firstElementChild as HTMLElement;
    expect(getMotion(panel, 'presence')?.owner).toBe('Snackbar');
    expect(getMotion(panel, 'emphasis')?.verb).toBe('emphasize');
    expect(host.hasAttribute('data-motion-presence')).toBe(false);
    expect(host.hasAttribute('inert')).toBe(false);
    expect(reported(error, '"fade" ignored: Snackbar already holds a presence on this element')).toHaveLength(1);
    fixture.destroy();
  });

  it('udx-side-sheet (standard): a presence on its panel is ignored, and development names SideSheet', () => {
    const fixture = TestBed.createComponent(SideSheetHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('udx-side-sheet') as HTMLElement;
    expect(host.getAttribute('data-motion-box')).toBe('child');
    const panel = host.querySelector('[aria-hidden]') as HTMLElement;
    expect(getMotion(panel, 'presence')?.owner).toBe('SideSheet');
    expect(getMotion(panel, 'layout')?.owner).toBe('SideSheet');
    expect(host.hasAttribute('data-motion-presence')).toBe(false);
    expect(reported(error, '"fade" ignored: SideSheet already holds a presence on this element')).toHaveLength(1);
    fixture.destroy();
  });

  it('Menu: the surface of an open udx-context-menu holds its presence, and a presence bound on it is ignored', async () => {
    const fixture = TestBed.createComponent(ContextMenuHost);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('button') as HTMLElement;
    trigger.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 10, clientY: 10 }));
    fixture.detectChanges();
    await fixture.whenStable();
    const menu = fixture.nativeElement.querySelector('[role="menu"]') as HTMLElement;
    expect(menu).not.toBeNull();
    expect(getMotion(menu, 'presence')?.owner).toBe('Menu');
    const binding = motion(menu, 'fade', { present: false });
    expect(menu.hasAttribute('data-motion-presence')).toBe(false);
    expect(reported(error, '"fade" ignored: Menu already holds a presence on this element')).toHaveLength(1);
    binding.destroy();
    fixture.destroy();
  });
});

describe('a Udixio host with no box to give (step E)', () => {
  it('a modal udx-side-sheet, udx-anchor-positioner and udx-context-menu are marked none, bind nothing, and say so', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const fixture = TestBed.createComponent(NoBoxHosts);
      fixture.detectChanges();
      const root = fixture.nativeElement as HTMLElement;
      const hosts = ['udx-side-sheet', 'udx-anchor-positioner', 'udx-context-menu'].map(
        (selector) => root.querySelector(selector) as HTMLElement,
      );
      expect(hosts.map((host) => host.getAttribute('data-motion-box'))).toEqual(['none', 'none', 'none']);
      for (const host of hosts) {
        expect(getMotions(host)).toEqual([]);
        expect(host.hasAttribute('data-motion-presence')).toBe(false);
      }
      expect(getMotions(root.querySelector('udx-context-menu button')!)).toEqual([]);
      const messages = reported(error, 'has no box to give (data-motion-box="none")');
      expect(messages).toHaveLength(3);
      for (const message of messages) expect(message).toContain('motion prop');
      fixture.destroy();
    } finally {
      error.mockRestore();
    }
  });
});
