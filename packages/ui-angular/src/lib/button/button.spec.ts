import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Button } from './button';

describe('Button (Angular, consuming @udixio/core)', () => {
  let fixture: ComponentFixture<Button>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Button],
    }).compileComponents();
    fixture = TestBed.createComponent(Button);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
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
    expect(button.querySelector('.label')?.className).toContain('invisible');
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
