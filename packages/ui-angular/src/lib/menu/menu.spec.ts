import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ContextMenu } from '../context-menu/context-menu';
import { Menu } from './menu';
import { MenuGroup } from './menu-group';
import { MenuHeadline } from './menu-headline';
import { MenuItem } from './menu-item';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [Menu, MenuGroup, MenuHeadline, MenuItem, ContextMenu],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-menu [purpose]="purpose()" accessibleLabel="Actions">
      <udx-menu-group label="Editing">
        <udx-menu-headline label="Clipboard" />
        <udx-menu-item label="Copy" />
        <udx-menu-item label="Paste" disabled />
      </udx-menu-group>
    </udx-menu>
  `,
})
class MenuTestHost {
  readonly purpose = signal<'actions' | 'selection'>('actions');
}

describe('Menu family', () => {
  let fixture: ComponentFixture<MenuTestHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuTestHost],
    }).compileComponents();
    fixture = TestBed.createComponent(MenuTestHost);
    fixture.detectChanges();
  });

  it('renders action-menu semantics and shared family structure', () => {
    expect(
      fixture.nativeElement
        .querySelector('[role="menu"]')
        .getAttribute('aria-label'),
    ).toBe('Actions');
    expect(
      fixture.nativeElement
        .querySelector('[role="group"]')
        .getAttribute('aria-labelledby'),
    ).toBeTruthy();
    const group: HTMLElement =
      fixture.nativeElement.querySelector('udx-menu-group');
    expect(group.classList.contains('mb-0.5')).toBe(true);
    expect(group.classList.contains('rounded-lg')).toBe(true);
    expect(group.classList.contains('first:rounded-t-2xl')).toBe(true);
    expect(group.classList.contains('last:rounded-b-2xl')).toBe(true);
    expect(
      fixture.nativeElement
        .querySelector('[role="menu"]')
        .classList.contains('bg-transparent'),
    ).toBe(true);
    expect(
      fixture.nativeElement.querySelectorAll('[role="menuitem"]'),
    ).toHaveLength(2);
    const disabledItem: HTMLElement = fixture.nativeElement.querySelector(
      '[role="menuitem"][data-menu-disabled="true"]',
    );
    expect(disabledItem.classList.contains('bg-secondary-container')).toBe(
      false,
    );
    expect(disabledItem.querySelector('udx-state-layer')).toBeNull();
    expect(
      fixture.nativeElement.querySelector('[role="presentation"]').textContent,
    ).toContain('Clipboard');
  });

  it('renders listbox and option semantics', () => {
    fixture.componentInstance.purpose.set('selection');
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[role="listbox"]'),
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelectorAll('[role="option"]'),
    ).toHaveLength(2);
  });

  it('moves focus with arrows and skips disabled items', () => {
    const items: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('[role="menuitem"]'),
    );
    items[0].focus();
    items[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    expect(document.activeElement).toBe(items[0]);
  });

  it('has no automated accessibility violations', async () => {
    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
  });
});

describe('MenuItem state', () => {
  it('owns uncontrolled selection and emits once', async () => {
    await TestBed.configureTestingModule({
      imports: [MenuItem],
    }).compileComponents();
    const fixture = TestBed.createComponent(MenuItem);
    fixture.componentRef.setInput('label', 'Bold');
    fixture.componentRef.setInput('selectionType', 'multiple');
    const changes: boolean[] = [];
    fixture.componentInstance.selectedChange.subscribe((value) =>
      changes.push(value),
    );
    fixture.detectChanges();
    const item: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');

    item.click();
    fixture.detectChanges();
    expect(item.getAttribute('aria-checked')).toBe('true');
    expect(item.classList.contains('bg-secondary-container')).toBe(true);
    expect(
      item
        .querySelector('[aria-hidden="true"]')
        ?.classList.contains('state-ripple-group-[menu-item]'),
    ).toBe(true);
    expect(changes).toEqual([true]);
  });

  it('requests controlled selection without mutating state', async () => {
    await TestBed.configureTestingModule({
      imports: [MenuItem],
    }).compileComponents();
    const fixture = TestBed.createComponent(MenuItem);
    fixture.componentRef.setInput('label', 'Bold');
    fixture.componentRef.setInput('selectionType', 'multiple');
    fixture.componentRef.setInput('selected', false);
    const changes: boolean[] = [];
    fixture.componentInstance.selectedChange.subscribe((value) =>
      changes.push(value),
    );
    fixture.detectChanges();
    const item: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');

    item.click();
    fixture.detectChanges();
    expect(item.getAttribute('aria-checked')).toBe('false');
    expect(changes).toEqual([true]);
  });

  it('makes disabled links inert', async () => {
    await TestBed.configureTestingModule({
      imports: [MenuItem],
    }).compileComponents();
    const fixture = TestBed.createComponent(MenuItem);
    fixture.componentRef.setInput('label', 'Archive');
    fixture.componentRef.setInput('href', '/archive');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const item: HTMLAnchorElement = fixture.nativeElement.querySelector('a');

    expect(item.hasAttribute('href')).toBe(false);
    expect(item.getAttribute('aria-disabled')).toBe('true');
    expect(item.tabIndex).toBe(-1);
  });
});

@Component({
  standalone: true,
  imports: [ContextMenu, MenuItem],
  template: `
    <udx-context-menu
      accessibleLabel="Document actions"
      (openChange)="changes.push($event)"
    >
      <button contextMenuTrigger>Document</button>
      <udx-menu-item label="Rename" />
    </udx-context-menu>
  `,
})
class ContextMenuTestHost {
  readonly changes: boolean[] = [];
}

describe('ContextMenu', () => {
  it('opens with Shift+F10 and restores focus on Escape', async () => {
    await TestBed.configureTestingModule({
      imports: [ContextMenuTestHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(ContextMenuTestHost);
    fixture.detectChanges();
    const trigger: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    trigger.focus();
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'F10',
        shiftKey: true,
        bubbles: true,
      }),
    );
    fixture.detectChanges();
    await Promise.resolve();

    const item: HTMLButtonElement =
      fixture.nativeElement.querySelector('[role="menuitem"]');
    expect(item).toBeTruthy();
    expect(document.activeElement).toBe(item);
    expect(fixture.componentInstance.changes).toEqual([true]);
    item.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    fixture.detectChanges();
    await Promise.resolve();
    expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(fixture.componentInstance.changes).toEqual([true, false]);
  });
});
