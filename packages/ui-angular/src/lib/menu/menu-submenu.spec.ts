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
});
