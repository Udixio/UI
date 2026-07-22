import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Button } from './button';

@Component({
  standalone: true,
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-button label="Fallback label">
      <strong>Projected label</strong>
    </lib-button>
  `,
})
class ProjectedButtonHost {}

@Component({
  standalone: true,
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-button
      label="Documentation"
      href="/docs"
      aria-label="Documentation link"
      aria-describedby="button-help"
      aria-current="page"
      target="_blank"
      rel="noreferrer"
      [tabIndex]="2"
    />
  `,
})
class AccessibleLinkButtonHost {}

@Component({
  standalone: true,
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-button
      label="Toggle"
      toggleable
      (click)="actions += 1"
      (pressedChange)="pressed = $event"
    />
  `,
})
class InteractiveButtonHost {
  actions = 0;
  pressed = false;
}

describe('Button (Angular, consuming @udixio/core)', () => {
  let fixture: ComponentFixture<Button>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Button,
        ProjectedButtonHost,
        AccessibleLinkButtonHost,
        InteractiveButtonHost,
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Button);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('keeps an unlabeled native control out of rendering and the accessibility tree', () => {
    fixture.detectChanges();

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    expect(button.hidden).toBe(true);
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-hidden')).toBe('true');
  });

  it('applies the shared Tailwind classes from @udixio/core (filled variant)', () => {
    fixture.componentRef.setInput('label', 'Envoyer');
    fixture.detectChanges();

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    // Classes produced by @udixio/core's buttonStyle — same source as React.
    expect(button.className).toContain('bg-primary');
    expect(button.className).toContain('text-on-primary');
    expect(button.textContent?.trim()).toBe('Envoyer');
    expect(button.querySelector('.touch-target')).not.toBeNull();
    const stateLayerHost: HTMLElement | null =
      button.querySelector('lib-state-layer');
    const stateLayer: HTMLElement | null = button.querySelector('.state-layer');
    expect(stateLayer).not.toBeNull();
    expect(button.style.borderRadius).toBe('40px');
    expect(button.style.transition).toBe('');
    expect(button.className).not.toContain('active:rounded');
    expect(stateLayerHost?.style.borderRadius).toBe('inherit');
    expect(stateLayer?.style.borderRadius).toBe('inherit');
  });

  it('renders icons and the shared loading indicator', () => {
    fixture.componentRef.setInput('label', 'Ajouter');
    fixture.componentRef.setInput(
      'icon',
      '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>',
    );
    fixture.detectChanges();

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    expect(button.querySelector('lib-icon svg')).not.toBeNull();

    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const loadingIndicator: SVGElement | null = button.querySelector(
      'lib-button-loading-indicator svg',
    );
    expect(loadingIndicator).not.toBeNull();
    expect(loadingIndicator?.style.stroke).toBe('var(--color-on-primary)');
    expect(button.querySelector('.label')?.className).toContain('opacity-0');
    expect(button.querySelector('.label')?.className).not.toContain(
      'invisible',
    );
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.textContent).toContain('Ajouter');
  });

  it('projects custom content with the label as fallback', () => {
    const hostFixture = TestBed.createComponent(ProjectedButtonHost);
    hostFixture.detectChanges();

    const button: HTMLButtonElement =
      hostFixture.nativeElement.querySelector('button');
    hostFixture.detectChanges();
    expect(button.hidden).toBe(false);
    expect(button.textContent?.trim()).toBe('Projected label');
    expect(button.textContent).not.toContain('Fallback label');
    expect(
      hostFixture.nativeElement.querySelector('lib-button').style.display,
    ).toBe('contents');
  });

  it('owns state initialized by defaultPressed in uncontrolled mode', () => {
    fixture.componentRef.setInput('label', 'Toggle');
    fixture.componentRef.setInput('toggleable', true);
    fixture.componentRef.setInput('defaultPressed', true);
    const emitted: boolean[] = [];
    fixture.componentInstance.pressedChange.subscribe((value) =>
      emitted.push(value),
    );
    fixture.detectChanges();

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.style.borderRadius).toBe('16px');
    expect(button.className).toContain('rounded-[16px]');
    expect(button.className).not.toContain('rounded-[40px]');

    button.click();
    fixture.detectChanges();

    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(emitted).toEqual([false]);
  });

  it('requests controlled changes without mutating the owned value', () => {
    fixture.componentRef.setInput('label', 'Toggle');
    fixture.componentRef.setInput('toggleable', true);
    fixture.componentRef.setInput('pressed', false);
    const emitted: boolean[] = [];
    fixture.componentInstance.pressedChange.subscribe((value) =>
      emitted.push(value),
    );
    fixture.detectChanges();

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    button.click();
    fixture.detectChanges();

    expect(emitted).toEqual([true]);
    expect(button.getAttribute('aria-pressed')).toBe('false');

    fixture.componentRef.setInput('pressed', true);
    fixture.detectChanges();
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('preserves undefined as uncontrolled through the pressed input transform', () => {
    fixture.componentRef.setInput('label', 'Toggle');
    fixture.componentRef.setInput('toggleable', true);
    fixture.componentRef.setInput('pressed', undefined);
    fixture.componentRef.setInput('defaultPressed', true);
    fixture.detectChanges();

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-pressed')).toBe('true');

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it.each(['disabled', 'loading'])(
    'blocks pressed changes while %s',
    (prop) => {
      fixture.componentRef.setInput('label', 'Toggle');
      fixture.componentRef.setInput('toggleable', true);
      fixture.componentRef.setInput(prop, true);
      const emitted: boolean[] = [];
      fixture.componentInstance.pressedChange.subscribe((value) =>
        emitted.push(value),
      );
      fixture.detectChanges();

      fixture.nativeElement.querySelector('button').click();

      expect(emitted).toEqual([]);
    },
  );

  it('normalizes variant aliases through the shared core behavior', () => {
    fixture.componentRef.setInput('label', 'Secondary');
    fixture.componentRef.setInput('variant', 'secondary');
    fixture.detectChanges();

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    expect(button.className).toContain('bg-secondary-container');
  });

  it('uses the semantic content color for toggle loading indicators', () => {
    fixture.componentRef.setInput('label', 'Toggle');
    fixture.componentRef.setInput('variant', 'tonal');
    fixture.componentRef.setInput('toggleable', true);
    fixture.componentRef.setInput('defaultPressed', true);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const indicator: SVGElement = fixture.nativeElement.querySelector(
      'lib-button-loading-indicator svg',
    );
    expect(indicator.style.stroke).toBe('var(--color-on-secondary)');
  });

  it('keeps navigation links out of toggle-button semantics', () => {
    fixture.componentRef.setInput('label', 'Destination');
    fixture.componentRef.setInput('href', '/destination');
    fixture.componentRef.setInput('toggleable', true);
    fixture.componentRef.setInput('defaultPressed', true);
    const emitted: boolean[] = [];
    fixture.componentInstance.pressedChange.subscribe((value) =>
      emitted.push(value),
    );
    fixture.detectChanges();

    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link.hasAttribute('aria-pressed')).toBe(false);
    expect(link.className).toContain('bg-primary');
    link.click();
    expect(emitted).toEqual([]);
  });

  it('keeps action and pressed-change events independent', () => {
    const hostFixture = TestBed.createComponent(InteractiveButtonHost);
    hostFixture.detectChanges();

    hostFixture.nativeElement.querySelector('button').click();
    hostFixture.detectChanges();

    expect(hostFixture.componentInstance.actions).toBe(1);
    expect(hostFixture.componentInstance.pressed).toBe(true);
  });

  it('forwards accessible link attributes to the interactive element', () => {
    const hostFixture = TestBed.createComponent(AccessibleLinkButtonHost);
    hostFixture.detectChanges();

    const link: HTMLAnchorElement =
      hostFixture.nativeElement.querySelector('a');
    expect(link.getAttribute('aria-label')).toBe('Documentation link');
    expect(link.getAttribute('aria-describedby')).toBe('button-help');
    expect(link.getAttribute('aria-current')).toBe('page');
    expect(link.target).toBe('_blank');
    expect(link.rel).toBe('noreferrer');
    expect(link.tabIndex).toBe(2);
  });

  it('uses logical icon positions while preserving physical aliases', () => {
    fixture.componentRef.setInput('label', 'Add');
    fixture.componentRef.setInput(
      'icon',
      '<svg viewBox="0 0 24 24"><path d="M12 5v14" /></svg>',
    );
    fixture.componentRef.setInput('iconPosition', 'start');
    fixture.detectChanges();

    let label: HTMLElement = fixture.nativeElement.querySelector('.label');
    expect(label.previousElementSibling?.tagName.toLowerCase()).toBe(
      'lib-icon',
    );

    fixture.componentRef.setInput('iconPosition', 'right');
    fixture.detectChanges();
    label = fixture.nativeElement.querySelector('.label');
    expect(label.nextElementSibling?.tagName.toLowerCase()).toBe('lib-icon');
  });

  it('keeps text alignment margins unless explicitly disabled', () => {
    fixture.componentRef.setInput('label', 'Text');
    fixture.componentRef.setInput('variant', 'text');
    fixture.detectChanges();
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    expect(button.className).toContain('-mx-6');

    fixture.componentRef.setInput('disableTextMargins', true);
    fixture.detectChanges();
    expect(button.className).not.toContain('-mx-6');
  });

  it('provides a durable focus-visible indicator and 48px touch target', () => {
    fixture.componentRef.setInput('label', 'Focus');
    fixture.detectChanges();
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');

    expect(button.className).toContain('focus-visible:outline-2');
    expect(button.className).toContain('focus-visible:outline-offset-2');
    const touchTarget = button.querySelector('.touch-target');
    expect(touchTarget?.className).toContain('h-12');
    expect(touchTarget?.className).toContain('min-w-12');
  });

  it('renders links and makes blocked links inert', () => {
    fixture.componentRef.setInput('label', 'Documentation');
    fixture.componentRef.setInput('href', '/docs');
    fixture.detectChanges();

    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link.getAttribute('href')).toBe('/docs');

    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    expect(link.getAttribute('href')).toBeNull();
    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.tabIndex).toBe(-1);
  });

  it('exposes semantic and external state to className functions', () => {
    fixture.componentRef.setInput('variant', 'tonal');
    fixture.componentRef.setInput('toggleable', true);
    fixture.componentRef.setInput('defaultPressed', true);
    fixture.componentRef.setInput(
      'className',
      (state: { variant?: string; isPressed?: boolean }) => ({
        button: `v-${state.variant} p-${state.isPressed}`,
      }),
    );
    fixture.detectChanges();
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    expect(button.className).toContain('v-tonal');
    expect(button.className).toContain('p-true');
  });
});
