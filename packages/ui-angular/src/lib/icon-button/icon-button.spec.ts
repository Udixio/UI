import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';
import { IconButton } from './icon-button';

expect.extend(toHaveNoViolations);

class NoopResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
(globalThis as any).ResizeObserver ??= NoopResizeObserver;

jest.mock('@udixio/core/dom', () => ({
  ...jest.requireActual('@udixio/core/dom'),
  createTooltipTransitionController: jest.fn(() => ({
    setOpen: jest.fn(),
    destroy: jest.fn(),
  })),
}));

const addIcon = '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>';
const closeIcon =
  '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>';

@Component({
  standalone: true,
  imports: [IconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-icon-button
      label="Favorite"
      [icon]="icon"
      [pressedIcon]="pressedIcon"
      toggleable
      (click)="actions += 1"
      (pressedChange)="pressed = $event"
    />
  `,
})
class InteractiveIconButtonHost {
  icon = addIcon;
  pressedIcon = closeIcon;
  actions = 0;
  pressed = false;
}

describe('IconButton (Angular, consuming @udixio/core)', () => {
  let fixture: ComponentFixture<IconButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconButton, InteractiveIconButtonHost],
    }).compileComponents();
    fixture = TestBed.createComponent(IconButton);
    fixture.componentRef.setInput('label', 'Add item');
    fixture.componentRef.setInput('icon', addIcon);
  });

  it('renders a named native button with safe form defaults', () => {
    fixture.detectChanges();
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');

    expect(button.type).toBe('button');
    expect(button.getAttribute('aria-label')).toBe('Add item');
    expect(button.querySelector('udx-icon svg')).not.toBeNull();
    expect(button.querySelector('.touch-target')).not.toBeNull();
    expect(button.querySelector('.state-layer')).not.toBeNull();
  });

  it('shows its accessible label in a tooltip on focus by default', () => {
    fixture.detectChanges();
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');

    button.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();

    const tooltip = document.querySelector('[role="tooltip"]') as HTMLElement;
    expect(tooltip.textContent).toContain('Add item');
    expect(tooltip.getAttribute('aria-hidden')).toBe('false');
    expect(button.hasAttribute('aria-describedby')).toBe(false);
  });

  it('supports custom tooltip text and explicit tooltip suppression', () => {
    fixture.componentRef.setInput('tooltip', 'Create a new item');
    fixture.detectChanges();
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    button.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    const tooltip = document.querySelector('[role="tooltip"]') as HTMLElement;

    expect(tooltip.textContent).toContain('Create a new item');
    expect(button.getAttribute('aria-describedby')).toBe(tooltip.id);

    fixture.componentRef.setInput('tooltip', false);
    fixture.detectChanges();
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('keeps container padding separate from the icon dimensions', () => {
    fixture.componentRef.setInput('size', 'small');
    fixture.detectChanges();
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    const icon: HTMLElement = button.querySelector('.icon')!;

    expect(button.classList).toContain('shrink-0');
    expect(button.classList).toContain('p-2');
    expect(icon.classList).toContain('size-6');
    expect(icon.classList).not.toContain('p-2');
  });

  it('keeps an empty-label control out of rendering and the accessibility tree', () => {
    fixture.componentRef.setInput('label', '');
    fixture.detectChanges();
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');

    expect(button.hidden).toBe(true);
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-hidden')).toBe('true');
  });

  it('forwards button type, tabindex, title as tooltip text, and classes', () => {
    fixture.componentRef.setInput('type', 'submit');
    fixture.componentRef.setInput('tabIndex', 2);
    fixture.componentRef.setInput('title', 'Add a new item');
    fixture.componentRef.setInput('className', 'consumer-class');
    fixture.detectChanges();
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');

    expect(button.type).toBe('submit');
    expect(button.tabIndex).toBe(2);
    button.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    expect(button.title).toBe('');
    expect(
      (document.querySelector('[role="tooltip"]') as HTMLElement).textContent,
    ).toContain('Add a new item');
    expect(button.className).toContain('consumer-class');
  });

  it('owns uncontrolled pressed state and swaps the icon', () => {
    const changes: boolean[] = [];
    fixture.componentRef.setInput('toggleable', true);
    fixture.componentRef.setInput('defaultPressed', true);
    fixture.componentRef.setInput('pressedIcon', closeIcon);
    fixture.componentInstance.pressedChange.subscribe((value) =>
      changes.push(value),
    );
    fixture.detectChanges();
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');

    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.querySelector('path')?.getAttribute('d')).toContain('M6 6');
    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(changes).toEqual([false]);
    expect(button.querySelector('path')?.getAttribute('d')).toContain('M12 5');
  });

  it('requests controlled changes without mutating controlled state', () => {
    const changes: boolean[] = [];
    fixture.componentRef.setInput('toggleable', true);
    fixture.componentRef.setInput('pressed', false);
    fixture.componentInstance.pressedChange.subscribe((value) =>
      changes.push(value),
    );
    fixture.detectChanges();
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');

    button.click();
    fixture.detectChanges();
    expect(changes).toEqual([true]);
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('does not expose pressed semantics unless toggleable', () => {
    fixture.componentRef.setInput('defaultPressed', true);
    fixture.detectChanges();

    expect(
      fixture.nativeElement
        .querySelector('button')
        .hasAttribute('aria-pressed'),
    ).toBe(false);
  });

  it('emits native click and pressed change once', () => {
    const host = TestBed.createComponent(InteractiveIconButtonHost);
    host.detectChanges();
    const button: HTMLButtonElement =
      host.nativeElement.querySelector('button');

    button.click();
    host.detectChanges();
    expect(host.componentInstance.actions).toBe(1);
    expect(host.componentInstance.pressed).toBe(true);
  });

  it('blocks disabled interaction', () => {
    const changes: boolean[] = [];
    fixture.componentRef.setInput('toggleable', true);
    fixture.componentRef.setInput('disabled', true);
    fixture.componentInstance.pressedChange.subscribe((value) =>
      changes.push(value),
    );
    fixture.detectChanges();
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');

    expect(button.disabled).toBe(true);
    button.click();
    expect(changes).toEqual([]);
  });

  it('renders navigation links without pressed semantics', () => {
    fixture.componentRef.setInput('href', '/docs');
    fixture.componentRef.setInput('toggleable', true);
    fixture.componentRef.setInput('defaultPressed', true);
    fixture.componentRef.setInput('aria-current', 'page');
    fixture.detectChanges();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');

    expect(link.getAttribute('href')).toBe('/docs');
    expect(link.getAttribute('aria-current')).toBe('page');
    expect(link.hasAttribute('aria-pressed')).toBe(false);
  });

  it('makes disabled navigation links inert', () => {
    fixture.componentRef.setInput('href', '/docs');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');

    expect(link.hasAttribute('href')).toBe(false);
    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.tabIndex).toBe(-1);
  });

  it('connects pointer feedback and cleans it up', () => {
    fixture.detectChanges();
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    const pointerDown = new MouseEvent('pointerdown', {
      clientX: 4,
      clientY: 4,
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(pointerDown, 'pointerType', { value: 'mouse' });
    button.dispatchEvent(pointerDown);
    const ripple = button.querySelector('[data-udixio-ripple]');

    expect(ripple).not.toBeNull();
    fixture.destroy();
    expect(ripple?.isConnected).toBe(false);
  });

  it('keeps a static radius when shape feedback is disabled', () => {
    fixture.componentRef.setInput('toggleable', true);
    fixture.componentRef.setInput('defaultPressed', true);
    fixture.componentRef.setInput('shapeFeedback', 'none');
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('button').style.borderRadius,
    ).toBe('40px');
  });

  it('has no automated accessibility violations', async () => {
    fixture.detectChanges();
    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
  });
});
