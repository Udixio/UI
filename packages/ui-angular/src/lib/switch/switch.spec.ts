import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Switch } from './switch';

expect.extend(toHaveNoViolations);

// The real Anime.js tween controller needs WAAPI (`Element.prototype.animate`),
// which jsdom does not implement -- mock the factory (preserving every other
// `@udixio/core/dom` export, e.g. `createStateLayerController` used by
// `lib-state-layer`) so tests exercise the component's wiring, not Anime.js
// internals against a fake DOM.
jest.mock('@udixio/core/dom', () => ({
  ...jest.requireActual('@udixio/core/dom'),
  createSwitchThumbController: jest.fn(() => ({
    update: jest.fn(),
    destroy: jest.fn(),
  })),
}));

@Component({
  standalone: true,
  imports: [Switch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<lib-switch aria-label="Wi-Fi" [(checked)]="checked" />`,
})
class ControlledSwitchHost {
  checked = false;
}

describe('Switch (Angular)', () => {
  let fixture: ComponentFixture<Switch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Switch, ControlledSwitchHost],
    }).compileComponents();
    fixture = TestBed.createComponent(Switch);
    fixture.componentRef.setInput('aria-label', 'Wi-Fi');
  });

  it('owns uncontrolled state and emits exactly one accepted transition', () => {
    const changes: boolean[] = [];
    fixture.componentRef.setInput('defaultChecked', true);
    fixture.componentInstance.checkedChange.subscribe((checked) =>
      changes.push(checked),
    );
    fixture.detectChanges();
    const toggle: HTMLElement = fixture.nativeElement.querySelector(
      '[role="switch"]',
    );

    expect(toggle.getAttribute('aria-checked')).toBe('true');
    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(changes).toEqual([false]);
  });

  it('requests controlled changes without mutating controlled state', () => {
    const changes: boolean[] = [];
    fixture.componentRef.setInput('checked', false);
    fixture.componentInstance.checkedChange.subscribe((checked) =>
      changes.push(checked),
    );
    fixture.detectChanges();
    const toggle: HTMLElement = fixture.nativeElement.querySelector(
      '[role="switch"]',
    );

    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(changes).toEqual([true]);
  });

  it('toggles via keyboard with Space and Enter', () => {
    const changes: boolean[] = [];
    fixture.componentInstance.checkedChange.subscribe((checked) =>
      changes.push(checked),
    );
    fixture.detectChanges();
    const toggle: HTMLElement = fixture.nativeElement.querySelector(
      '[role="switch"]',
    );

    toggle.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    toggle.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(changes).toEqual([true, false]);
  });

  it('blocks disabled interaction', () => {
    const changes: boolean[] = [];
    fixture.componentRef.setInput('disabled', true);
    fixture.componentInstance.checkedChange.subscribe((checked) =>
      changes.push(checked),
    );
    fixture.detectChanges();
    const toggle: HTMLElement = fixture.nativeElement.querySelector(
      '[role="switch"]',
    );

    expect(toggle.getAttribute('aria-disabled')).toBe('true');
    expect(toggle.getAttribute('tabindex')).toBe('-1');
    toggle.click();
    expect(changes).toEqual([]);
  });

  it('supports two-way checked binding', () => {
    const host = TestBed.createComponent(ControlledSwitchHost);
    host.detectChanges();
    const toggle: HTMLElement = host.nativeElement.querySelector(
      '[role="switch"]',
    );

    toggle.click();
    host.detectChanges();
    expect(host.componentInstance.checked).toBe(true);
  });

  it('has no automated accessibility violations', async () => {
    const host = TestBed.createComponent(ControlledSwitchHost);
    host.detectChanges();
    expect(await axe(host.nativeElement)).toHaveNoViolations();
  });
});
