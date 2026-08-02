import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import * as coreDom from '@udixio/core/dom';
import { NavigationRail } from './navigation-rail';
import { NavigationRailItem } from './navigation-rail-item';
import { NavigationRailSection } from './navigation-rail-section';
import type { NavigationRailItemSelectedEvent } from './navigation-rail';

const iAlarm = 'M0 0h24v24H0z';

@Component({
  standalone: true,
  imports: [NavigationRail, NavigationRailItem, NavigationRailSection],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-navigation-rail
      [extended]="extended()"
      [defaultExtended]="defaultExtended()"
      [selectedItem]="selectedItem()"
      (extendedChange)="extendedChanges.push($event)"
      (selectedItemChange)="selectedItemChanges.push($event)"
      (itemSelected)="itemSelections.push($event)"
    >
      <div footer><button>Sign out</button></div>
      <lib-navigation-rail-item [icon]="iAlarm" [iconSelected]="iAlarm" label="Alarm" />
      <lib-navigation-rail-item [icon]="iAlarm" [iconSelected]="iAlarm" label="Clock" />
      <lib-navigation-rail-section label="Sleep well" />
      <lib-navigation-rail-item [icon]="iAlarm" [iconSelected]="iAlarm" label="Schedule" />
    </lib-navigation-rail>
  `,
})
class NavigationRailTestHost {
  readonly iAlarm = iAlarm;
  readonly extended = signal<boolean | undefined>(undefined);
  readonly defaultExtended = signal(false);
  readonly selectedItem = signal<number | null | undefined>(undefined);
  readonly extendedChanges: boolean[] = [];
  readonly selectedItemChanges: (number | null)[] = [];
  readonly itemSelections: NavigationRailItemSelectedEvent[] = [];
}

describe('NavigationRail (Angular, consuming @udixio/core)', () => {
  let fixture: ComponentFixture<NavigationRailTestHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationRailTestHost],
    }).compileComponents();
    fixture = TestBed.createComponent(NavigationRailTestHost);
  });

  it('owns an uncontrolled extended state and emits each accepted transition once', () => {
    fixture.detectChanges();
    const toggle = fixture.nativeElement.querySelector(
      'button[aria-label="Open menu"]',
    ) as HTMLButtonElement;
    expect(toggle).toBeTruthy();

    toggle.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.extendedChanges).toEqual([true]);
    expect(
      fixture.nativeElement.querySelector('button[aria-label="Close menu"]'),
    ).toBeTruthy();
  });

  it('requests controlled extended changes without mutating the rendered value', () => {
    fixture.componentInstance.extended.set(false);
    fixture.detectChanges();

    const toggle = fixture.nativeElement.querySelector(
      'button[aria-label="Open menu"]',
    ) as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.extendedChanges).toEqual([true]);
    expect(
      fixture.nativeElement.querySelector('button[aria-label="Open menu"]'),
    ).toBeTruthy();
  });

  it('updates the rendered extended state when the controlled owner changes it', () => {
    fixture.componentInstance.extended.set(false);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('button[aria-label="Open menu"]'),
    ).toBeTruthy();

    fixture.componentInstance.extended.set(true);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('button[aria-label="Close menu"]'),
    ).toBeTruthy();
  });

  it('renders footer content pinned below the segments', () => {
    fixture.detectChanges();
    const footerButton = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ).find((el) => (el as HTMLElement).textContent?.trim() === 'Sign out');
    expect(footerButton).toBeTruthy();
  });

  it('only renders the section label and items after it while extended', () => {
    fixture.componentInstance.extended.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Sleep well');
    expect(fixture.nativeElement.textContent).not.toContain('Schedule');
    expect(fixture.nativeElement.textContent).toContain('Alarm');
    expect(fixture.nativeElement.textContent).toContain('Clock');

    fixture.componentInstance.extended.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sleep well');
    expect(fixture.nativeElement.textContent).toContain('Schedule');
  });

  it('exposes aria-current="page" only for the item matching the tracked index', () => {
    fixture.componentInstance.selectedItem.set(0);
    fixture.detectChanges();

    const items: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('[aria-current]'),
    );
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Alarm');
  });

  it('moves the selection when a different item is clicked', () => {
    fixture.componentInstance.selectedItem.set(undefined);
    fixture.detectChanges();

    const buttons: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ).filter((el) => (el as HTMLElement).textContent?.includes('Clock'));
    (buttons[0] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedItemChanges).toEqual([1]);
  });

  it('notifies itemSelected exactly once when the resolved selection settles on an item', () => {
    fixture.componentInstance.selectedItem.set(0);
    fixture.detectChanges();

    expect(fixture.componentInstance.itemSelections).toHaveLength(1);
    expect(fixture.componentInstance.itemSelections[0]).toEqual(
      expect.objectContaining({ index: 0, label: 'Alarm' }),
    );
  });

  it('always renders one label per layout, and reveals only the one matching the resolved variant', () => {
    // Regression test: the label used to have no Motion transition in
    // Angular at all; it is now two always-mounted spans (horizontal/
    // vertical) whose visibility is driven by the shared
    // `@udixio/core/dom` label controller, same as React.
    fixture.componentInstance.extended.set(false);
    fixture.detectChanges();

    const button = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ).find((el) => (el as HTMLElement).textContent?.includes('Alarm')) as
      | HTMLElement
      | undefined;
    expect(button).toBeTruthy();

    const [horizontalLabel, verticalLabel] = Array.from(
      button!.querySelectorAll('span'),
    ).filter((span) => span.textContent === 'Alarm');

    expect(horizontalLabel.getAttribute('aria-hidden')).toBe('true');
    expect(verticalLabel.getAttribute('aria-hidden')).toBe('false');

    fixture.componentInstance.extended.set(true);
    fixture.detectChanges();

    expect(horizontalLabel.getAttribute('aria-hidden')).toBe('false');
    expect(verticalLabel.getAttribute('aria-hidden')).toBe('true');
  });

  it('applies a CSS transition to the rail, each item, and its container so extend/collapse never snaps', () => {
    // Regression test: the Motion label controller only animates the label
    // itself. Without a plain CSS `transition` on the rail's root, each
    // item's root, and its container, the rail's own width and each item's
    // gap/padding still snapped instantly between collapsed and extended,
    // reading as "no animation" even once the label was fixed.
    fixture.detectChanges();

    const rail = fixture.nativeElement.querySelector(
      '.navigation-rail',
    ) as HTMLElement;
    expect(rail.style.transition).not.toBe('');

    const button = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ).find((el) => (el as HTMLElement).textContent?.includes('Alarm')) as
      | HTMLElement
      | undefined;
    expect(button!.style.transition).not.toBe('');

    const container = button!.querySelector('.container') as HTMLElement;
    expect(container.style.transition).not.toBe('');
  });

});

@Component({
  standalone: true,
  imports: [NavigationRail, NavigationRailItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-navigation-rail [extended]="extended()">
      <lib-navigation-rail-item [icon]="iAlarm" [iconSelected]="iAlarm" label="Alarm" />
    </lib-navigation-rail>
  `,
})
class SingleItemTestHost {
  readonly iAlarm = iAlarm;
  readonly extended = signal(false);
}

describe('NavigationRailItem label controller lifecycle', () => {
  it('wires the label controller once and never recreates it across later toggles', () => {
    // Regression test: `afterRenderEffect` re-ran on every render because
    // the `viewChild` query signal refreshed its own wrapper identity even
    // when the underlying DOM node hadn't changed. That tore down and
    // recreated both controllers on every single extend/collapse, which
    // reset their "first apply is instant" bookkeeping -- so every toggle
    // replayed as a fresh, unanimated mount instead of actually animating.
    const spy = jest.spyOn(coreDom, 'createNavigationRailItemLabelController');

    TestBed.configureTestingModule({ imports: [SingleItemTestHost] });
    const fixture = TestBed.createComponent(SingleItemTestHost);
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledTimes(2); // one per label axis

    fixture.componentInstance.extended.set(true);
    fixture.detectChanges();
    fixture.componentInstance.extended.set(false);
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('renders only one visible label immediately, with a resting style frozen at construction', () => {
    // Regression test: the label's resting width/height/opacity/aria-hidden
    // used to be set entirely by the afterRenderEffect that wires the
    // Motion controller. Angular's SSR (and the first client render before
    // that effect flushes) never runs it, so both labels rendered fully
    // visible until the effect caught up -- the "labels visible regardless
    // of extended, doubled until the rail settles" symptom. The fix
    // computes the resting style once in the constructor instead, so it is
    // part of the initial render output itself, not an effect side effect.
    TestBed.configureTestingModule({ imports: [SingleItemTestHost] });
    const fixture = TestBed.createComponent(SingleItemTestHost);
    fixture.detectChanges();

    const item = fixture.debugElement.query(
      By.directive(NavigationRailItem),
    ).componentInstance as NavigationRailItem;
    const initialHorizontal = (item as any).initialHorizontalStyle;
    const initialVertical = (item as any).initialVerticalStyle;

    // Collapsed by default: horizontal hidden, vertical visible.
    expect(initialHorizontal).toEqual({
      width: '0px',
      opacity: '0',
      overflow: 'hidden',
    });
    expect(initialVertical).toEqual({ overflow: 'hidden' });

    const spans = fixture.nativeElement.querySelectorAll('span.label');
    const hidden = Array.from(spans).find(
      (el) => (el as HTMLElement).getAttribute('aria-hidden') === 'true',
    ) as HTMLElement;
    const visible = Array.from(spans).find(
      (el) => (el as HTMLElement).getAttribute('aria-hidden') === 'false',
    ) as HTMLElement;
    expect(hidden.style.width).toBe('0px');
    expect(hidden.style.opacity).toBe('0');
    expect(visible.style.opacity).not.toBe('0');

    // Must stay frozen (same object) across later resolvedVariant() changes
    // -- a reactive computed() here would race the Motion controller and
    // silently turn every transition into a same-value no-op snap.
    fixture.componentInstance.extended.set(true);
    fixture.detectChanges();
    expect((item as any).initialHorizontalStyle).toBe(initialHorizontal);
    expect((item as any).initialVerticalStyle).toBe(initialVertical);
  });
});
