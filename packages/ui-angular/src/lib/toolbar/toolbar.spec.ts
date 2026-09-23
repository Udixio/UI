import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';
import type { ToolbarAction } from '@udixio/core';
import { Toolbar } from './toolbar';
import { IconButton } from '../icon-button/icon-button';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [Toolbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main>
      <h2 id="toolbar-title">Document actions</h2>
      <udx-toolbar aria-labelledby="toolbar-title">
        <button type="button" aria-label="Add">Add</button>
      </udx-toolbar>
    </main>
  `,
})
class AccessibilityToolbarHost {}

@Component({
  standalone: true,
  imports: [IconButton, Toolbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-toolbar variant="floating" accessibleLabel="Document actions">
      <udx-icon-button label="Add" [icon]="icon" />
    </udx-toolbar>
  `,
})
class FloatingToolbarHost {
  protected readonly icon =
    '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>';
}

const toolbarActions: ToolbarAction[] = [
  {
    id: 'add',
    label: 'Add',
    icon: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>',
  },
  {
    id: 'share',
    label: 'Share',
    icon: '<svg viewBox="0 0 24 24"><path d="M12 4v16M4 12h16" /></svg>',
  },
];

describe('Toolbar (Angular, consuming @udixio/core)', () => {
  let fixture: ComponentFixture<Toolbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Toolbar, AccessibilityToolbarHost],
    }).compileComponents();
    fixture = TestBed.createComponent(Toolbar);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders a named toolbar with the docked treatment by default', () => {
    fixture.componentRef.setInput('accessibleLabel', 'Document actions');
    fixture.detectChanges();

    const toolbar: HTMLDivElement =
      fixture.nativeElement.querySelector('[role="toolbar"]');
    expect(toolbar).not.toBeNull();
    expect(toolbar.className).toContain('bg-surface-container');
    expect(toolbar.className).toContain('w-full');
    expect(toolbar.getAttribute('aria-label')).toBe('Document actions');
  });

  it('applies floating, vibrant, and vertical treatments', () => {
    fixture.componentRef.setInput('variant', 'floating');
    fixture.componentRef.setInput('color', 'vibrant');
    fixture.componentRef.setInput('orientation', 'vertical');
    fixture.detectChanges();

    const toolbar: HTMLDivElement =
      fixture.nativeElement.querySelector('[role="toolbar"]');
    expect(toolbar.className).toContain('bg-primary-container');
    expect(toolbar.className).toContain('rounded-[32px]');
    expect(toolbar.className).toContain('flex-col');
    expect(toolbar.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('forwards aria-labelledby to the semantic root', () => {
    fixture.componentRef.setInput('aria-labelledby', 'toolbar-title');
    fixture.detectChanges();

    expect(
      fixture.nativeElement
        .querySelector('[role="toolbar"]')
        .getAttribute('aria-labelledby'),
    ).toBe('toolbar-title');
  });

  it('exposes the resolved state to a classes function', () => {
    fixture.componentRef.setInput('variant', 'floating');
    fixture.componentRef.setInput(
      'classes',
      ({ variant }: { variant?: string }) => ({
        toolbar: variant === 'floating' ? 'custom-floating' : 'custom-docked',
      }),
    );
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[role="toolbar"]').className,
    ).toContain('custom-floating');
  });

  it('renders data-driven actions and exposes the generated overflow trigger', () => {
    fixture.componentRef.setInput('actions', toolbarActions);
    fixture.componentRef.setInput('maxVisible', 1);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('button[aria-label="Add"]'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('button[aria-label="Share"]'),
    ).toBeNull();

    const trigger = fixture.nativeElement.querySelector(
      'button[aria-label="More actions"]',
    ) as HTMLButtonElement;
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.hasAttribute('aria-describedby')).toBe(false);
    trigger.click();
    fixture.detectChanges();
    expect(document.querySelector('[role="menu"]')).not.toBeNull();
  });

  it('keeps floating toolbar icon buttons rounded while pressed', () => {
    const host = TestBed.createComponent(FloatingToolbarHost);
    host.detectChanges();
    const button = host.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;

    expect(button.style.borderRadius).toBe('40px');
    const pointerDown = new MouseEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(pointerDown, 'pointerType', { value: 'mouse' });
    button.dispatchEvent(pointerDown);
    expect(button.style.borderRadius).toBe('40px');
  });

  it('has no axe violations when composed with native action controls', async () => {
    const hostFixture = TestBed.createComponent(AccessibilityToolbarHost);
    hostFixture.detectChanges();

    expect(await axe(hostFixture.nativeElement)).toHaveNoViolations();
  });
});
