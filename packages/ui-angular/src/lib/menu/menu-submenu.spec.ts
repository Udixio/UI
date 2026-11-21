import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Menu } from './menu';
import { MenuItem } from './menu-item';
import { MenuSubmenu } from './menu-submenu';

@Component({
  standalone: true,
  imports: [Menu, MenuItem, MenuSubmenu],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-menu accessibleLabel="Document actions">
      <udx-menu-submenu label="Share" [lazy]="lazy()">
        <udx-menu-item label="Copy link" />
      </udx-menu-submenu>
      <udx-menu-item label="Rename" />
    </udx-menu>
  `,
})
class SubmenuTestHost {
  readonly lazy = signal(false);
}

describe('MenuSubmenu (Angular)', () => {
  let fixture: ComponentFixture<SubmenuTestHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubmenuTestHost],
    }).compileComponents();
    fixture = TestBed.createComponent(SubmenuTestHost);
  });

  const surface = () =>
    fixture.nativeElement.querySelector(
      '[data-menu-submenu-surface]',
    ) as HTMLElement | null;

  it('keeps a closed submenu in the DOM, hidden', () => {
    fixture.detectChanges();

    expect(surface()).not.toBeNull();
    expect(surface()!.hidden).toBe(true);
    expect(surface()!.textContent).toContain('Copy link');
  });

  it('shows the submenu when it opens', () => {
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector(
      '[role="menuitem"][aria-haspopup="menu"]',
    ) as HTMLElement;

    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(surface()!.hidden).toBe(false);
  });

  it('renders nothing of a lazy submenu while it is closed', () => {
    fixture.componentInstance.lazy.set(true);
    fixture.detectChanges();

    expect(surface()).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Copy link');
  });

  /** Lets the exit's promise chain run, then renders what it changed. */
  const settle = async () => {
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const openWithKeyboard = () => {
    const trigger = fixture.nativeElement.querySelector(
      '[role="menuitem"][aria-haspopup="menu"]',
    ) as HTMLElement;
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    fixture.detectChanges();
    return trigger;
  };

  const closeWithEscape = () => {
    const nested = surface()!.querySelector('[role="menu"]') as HTMLElement;
    nested.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    fixture.detectChanges();
  };

  it('grows the submenu from its trigger and keeps it shown, inert, until its exit ends', async () => {
    fixture.detectChanges();
    const trigger = openWithKeyboard();
    const nested = surface()!.querySelector('[role="menu"]') as HTMLElement;
    // The motion controller points the scale at the trigger.
    expect(nested.style.transformOrigin).not.toBe('');

    closeWithEscape();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    // Closed at once for assistive technologies and the keyboard, still seen until the exit has played.
    expect(surface()!.hasAttribute('inert')).toBe(true);
    expect(surface()!.hidden).toBe(false);

    await settle();
    expect(surface()!.hidden).toBe(true);
  });

  it('keeps a lazy submenu rendered until its exit ends', async () => {
    fixture.componentInstance.lazy.set(true);
    fixture.detectChanges();
    openWithKeyboard();
    expect(surface()).not.toBeNull();

    closeWithEscape();
    expect(surface()).not.toBeNull();

    await settle();
    expect(surface()).toBeNull();
  });
});
