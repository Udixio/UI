import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';
import type { CheckboxInterface, ClassNameComponent } from '@udixio/core';
import { Checkbox } from './checkbox';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [Checkbox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-checkbox id="updates" [(checked)]="checked" />
    <label for="updates">Product updates</label>
  `,
})
class ControlledCheckboxHost {
  checked = false;
}

describe('Checkbox (Angular)', () => {
  let fixture: ComponentFixture<Checkbox>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Checkbox, ControlledCheckboxHost],
    }).compileComponents();
    fixture = TestBed.createComponent(Checkbox);
    fixture.componentRef.setInput('id', 'updates');
  });

  it('owns uncontrolled state and emits exactly one accepted transition', () => {
    const changes: boolean[] = [];
    fixture.componentRef.setInput('defaultChecked', true);
    fixture.componentInstance.checkedChange.subscribe((checked) =>
      changes.push(checked),
    );
    fixture.detectChanges();
    const checkbox: HTMLInputElement =
      fixture.nativeElement.querySelector('input');

    expect(checkbox.checked).toBe(true);
    checkbox.click();
    fixture.detectChanges();
    expect(checkbox.checked).toBe(false);
    expect(changes).toEqual([false]);
  });

  it('requests controlled changes without mutating controlled state', () => {
    const changes: boolean[] = [];
    fixture.componentRef.setInput('checked', false);
    fixture.componentInstance.checkedChange.subscribe((checked) =>
      changes.push(checked),
    );
    fixture.detectChanges();
    const checkbox: HTMLInputElement =
      fixture.nativeElement.querySelector('input');

    checkbox.click();
    fixture.detectChanges();
    expect(checkbox.checked).toBe(false);
    expect(changes).toEqual([true]);
  });

  it('blocks disabled interaction and maps invalid state to aria-invalid', () => {
    const changes: boolean[] = [];
    fixture.componentRef.setInput('disabled', true);
    fixture.componentRef.setInput('invalid', true);
    fixture.componentInstance.checkedChange.subscribe((checked) =>
      changes.push(checked),
    );
    fixture.detectChanges();
    const checkbox: HTMLInputElement =
      fixture.nativeElement.querySelector('input');

    expect(checkbox.disabled).toBe(true);
    expect(checkbox.getAttribute('aria-invalid')).toBe('true');
    checkbox.click();
    expect(changes).toEqual([]);
  });

  it('supports native mixed state and keeps semantics outside aria-hidden content', () => {
    fixture.componentRef.setInput('indeterminate', true);
    fixture.detectChanges();
    const checkbox: HTMLInputElement =
      fixture.nativeElement.querySelector('input');

    expect(checkbox.indeterminate).toBe(true);
    expect(checkbox.closest('[aria-hidden="true"]')).toBeNull();
  });

  it('exposes focus changes to state-aware classes', () => {
    const focusStates: boolean[] = [];
    const className: ClassNameComponent<CheckboxInterface> = (state) => {
      focusStates.push(state.isFocused);
      return {};
    };
    fixture.componentRef.setInput('className', className);
    fixture.detectChanges();
    const checkbox: HTMLInputElement =
      fixture.nativeElement.querySelector('input');

    checkbox.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    expect(focusStates).toContain(true);
    checkbox.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(focusStates.at(-1)).toBe(false);
  });

  it('supports two-way checked binding', () => {
    const host = TestBed.createComponent(ControlledCheckboxHost);
    host.detectChanges();
    const checkbox: HTMLInputElement =
      host.nativeElement.querySelector('input');

    checkbox.click();
    host.detectChanges();
    expect(host.componentInstance.checked).toBe(true);
  });

  it('has no automated accessibility violations', async () => {
    const host = TestBed.createComponent(ControlledCheckboxHost);
    host.detectChanges();
    expect(await axe(host.nativeElement)).toHaveNoViolations();
  });
});
