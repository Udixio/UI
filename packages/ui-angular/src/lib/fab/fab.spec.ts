import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { createFabLabelController } from '@udixio/core/dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Fab } from './fab';

expect.extend(toHaveNoViolations);

// The real Anime.js Layout controller behind the Fab label needs WAAPI, which
// jsdom does not have. Mock that factory (preserving every other
// `@udixio/core/dom` export) so these tests exercise the component's wiring,
// matching the Switch/TextField specs.
jest.mock('@udixio/core/dom', () => ({
  ...jest.requireActual('@udixio/core/dom'),
  createFabLabelController: jest.fn(() => ({
    update: jest.fn(),
    destroy: jest.fn(),
  })),
}));

const addIcon = '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>';

describe('Fab (Angular, consuming @udixio/core)', () => {
  let fixture: ComponentFixture<Fab>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Fab],
    }).compileComponents();
    fixture = TestBed.createComponent(Fab);
    fixture.componentRef.setInput('label', 'Create');
    fixture.componentRef.setInput('icon', addIcon);
  });

  it('renders a named action with safe form defaults', () => {
    fixture.detectChanges();
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');

    expect(button.type).toBe('button');
    expect(button.getAttribute('aria-label')).toBe('Create');
    expect(button.querySelector('udx-icon svg')).not.toBeNull();
    expect(button.querySelector('.touch-target')).not.toBeNull();
    expect(button.querySelector('.state-layer')).not.toBeNull();
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

  it('keeps the label mounted but collapsed until the fab is extended', () => {
    // The label element is always rendered so the shared Anime.js Layout
    // controller can diff its width open and closed; the compact state
    // renders it zero-width and hides it from the accessibility tree instead
    // of removing it with `@if`.
    fixture.detectChanges();
    const label: HTMLElement = fixture.nativeElement.querySelector('.label');
    expect(label).not.toBeNull();
    expect(label.style.width).toBe('0px');
    expect(label.style.opacity).toBe('0');
    expect(label.getAttribute('aria-hidden')).toBe('true');

    fixture.componentRef.setInput('extended', true);
    fixture.detectChanges();
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    const extendedLabel: HTMLElement =
      fixture.nativeElement.querySelector('.label');
    expect(button.textContent?.trim()).toBe('Create');
    expect(button.hasAttribute('aria-label')).toBe(false);
    expect(extendedLabel.hasAttribute('aria-hidden')).toBe(false);
  });

  it('forwards native action attributes and shared classes', () => {
    fixture.componentRef.setInput('type', 'submit');
    fixture.componentRef.setInput('tabIndex', 2);
    fixture.componentRef.setInput('title', 'Create item');
    fixture.componentRef.setInput('className', 'consumer-class');
    fixture.detectChanges();
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');

    expect(button.type).toBe('submit');
    expect(button.tabIndex).toBe(2);
    expect(button.title).toBe('Create item');
    expect(button.className).toContain('consumer-class');
  });

  it('blocks disabled actions', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);
  });

  it('renders links and makes disabled links inert', () => {
    fixture.componentRef.setInput('href', '/create');
    fixture.componentRef.setInput('aria-current', 'page');
    fixture.detectChanges();
    let link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link.getAttribute('href')).toBe('/create');
    expect(link.getAttribute('aria-current')).toBe('page');

    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    link = fixture.nativeElement.querySelector('a');
    expect(link.hasAttribute('href')).toBe(false);
    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.tabIndex).toBe(-1);
  });

  it('connects pointer feedback and cleans it up', () => {
    fixture.detectChanges();
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    const pointerDown = new MouseEvent('pointerdown', {
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

  it('has no automated accessibility violations', async () => {
    fixture.detectChanges();
    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
  });
});

@Component({
  standalone: true,
  imports: [Fab],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<udx-fab label="Create" [icon]="icon" [extended]="extended()" />`,
})
class FabTestHost {
  readonly icon = addIcon;
  readonly extended = signal(false);
}

describe('Fab label controller lifecycle', () => {
  it('wires the label controller once and never recreates it across later toggles', () => {
    // Recreating the controller would reset its "first apply is instant"
    // bookkeeping and re-record the Layout baseline, so every extend/collapse
    // would replay as a fresh mount and silently never animate.
    const factory = jest.mocked(createFabLabelController);
    factory.mockClear();

    TestBed.configureTestingModule({ imports: [FabTestHost] });
    const fixture = TestBed.createComponent(FabTestHost);
    fixture.detectChanges();
    expect(factory).toHaveBeenCalledTimes(1);

    fixture.componentInstance.extended.set(true);
    fixture.detectChanges();
    fixture.componentInstance.extended.set(false);
    fixture.detectChanges();

    expect(factory).toHaveBeenCalledTimes(1);
  });
});
