import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Tab } from './tab';
import { Tabs } from './tabs';
import { TabGroup } from './tab-group';
import { TabPanels } from './tab-panels';
import { TabPanel } from './tab-panel';

@Component({
  standalone: true,
  imports: [Tabs, Tab],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-tabs
      [selectedTab]="selectedTab()"
      [defaultSelectedTab]="defaultSelectedTab()"
      (selectedTabChange)="selectedTabChanges.push($event)"
    >
      <udx-tab label="One" />
      <udx-tab label="Two" [disabled]="twoDisabled()" />
      <udx-tab label="Three" />
    </udx-tabs>
  `,
})
class TabsTestHost {
  readonly selectedTab = signal<number | null | undefined>(undefined);
  readonly defaultSelectedTab = signal<number | null>(0);
  readonly twoDisabled = signal(false);
  readonly selectedTabChanges: (number | null)[] = [];
}

function tabButton(fixture: ComponentFixture<TabsTestHost>, label: string) {
  return Array.from(
    fixture.nativeElement.querySelectorAll('[role="tab"]'),
  ).find((el) => (el as HTMLElement).textContent?.trim() === label) as
    | HTMLElement
    | undefined;
}

describe('Tabs (Angular, consuming @udixio/core)', () => {
  let fixture: ComponentFixture<TabsTestHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabsTestHost],
    }).compileComponents();
    fixture = TestBed.createComponent(TabsTestHost);
  });

  it('owns an uncontrolled selection defaulting to the first tab', () => {
    fixture.detectChanges();

    expect(tabButton(fixture, 'One')?.getAttribute('aria-selected')).toBe(
      'true',
    );
    expect(tabButton(fixture, 'Two')?.getAttribute('aria-selected')).toBe(
      'false',
    );
  });

  it('moves the uncontrolled selection on click and notifies once', () => {
    fixture.detectChanges();

    tabButton(fixture, 'Three')!.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedTabChanges).toEqual([2]);
    expect(tabButton(fixture, 'Three')?.getAttribute('aria-selected')).toBe(
      'true',
    );
  });

  it('requests a controlled change without mutating the rendered selection', () => {
    fixture.componentInstance.selectedTab.set(0);
    fixture.detectChanges();

    tabButton(fixture, 'Three')!.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedTabChanges).toEqual([2]);
    expect(tabButton(fixture, 'One')?.getAttribute('aria-selected')).toBe(
      'true',
    );
  });

  it('renders the selection the controlled owner assigns', () => {
    fixture.componentInstance.selectedTab.set(0);
    fixture.detectChanges();
    expect(tabButton(fixture, 'One')?.getAttribute('aria-selected')).toBe(
      'true',
    );

    fixture.componentInstance.selectedTab.set(1);
    fixture.detectChanges();
    expect(tabButton(fixture, 'Two')?.getAttribute('aria-selected')).toBe(
      'true',
    );
  });

  it('does not select a disabled tab on click', () => {
    fixture.componentInstance.twoDisabled.set(true);
    fixture.detectChanges();

    tabButton(fixture, 'Two')!.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedTabChanges).toEqual([]);
    expect(tabButton(fixture, 'One')?.getAttribute('aria-selected')).toBe(
      'true',
    );
  });

  it('uses a roving tabIndex with a single stop in the tab order', () => {
    fixture.componentInstance.selectedTab.set(1);
    fixture.detectChanges();

    expect(tabButton(fixture, 'One')?.getAttribute('tabindex')).toBe('-1');
    expect(tabButton(fixture, 'Two')?.getAttribute('tabindex')).toBe('0');
  });

  it('moves selection with ArrowRight, wrapping and skipping disabled tabs', () => {
    fixture.componentInstance.twoDisabled.set(true);
    fixture.detectChanges();

    tabButton(fixture, 'One')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    fixture.detectChanges();
    expect(tabButton(fixture, 'Three')?.getAttribute('aria-selected')).toBe(
      'true',
    );

    tabButton(fixture, 'Three')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    fixture.detectChanges();
    expect(tabButton(fixture, 'One')?.getAttribute('aria-selected')).toBe(
      'true',
    );
  });

  it('jumps to the first/last enabled tab on Home/End', () => {
    fixture.componentInstance.selectedTab.set(1);
    fixture.detectChanges();

    tabButton(fixture, 'Two')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true }),
    );
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedTabChanges).toEqual([2]);
  });

  it('does not wire aria-controls without a connected TabPanels', () => {
    fixture.detectChanges();
    expect(tabButton(fixture, 'One')?.hasAttribute('aria-controls')).toBe(
      false,
    );
  });
});

@Component({
  standalone: true,
  imports: [Tabs, Tab],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-tabs [variant]="variant()">
      <udx-tab label="One" />
    </udx-tabs>
  `,
})
class TabsVariantTestHost {
  readonly variant = signal<'primary' | 'secondary'>('primary');
}

function mockContentAndTabRects(width: { content: number; tab: number }) {
  const original = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function (
    this: HTMLElement,
  ) {
    const value = this.classList.contains('content')
      ? width.content
      : this.classList.contains('tab')
        ? width.tab
        : 0;
    return {
      left: 0,
      top: 0,
      right: value,
      bottom: 0,
      width: value,
      height: 0,
      x: 0,
      y: 0,
      toJSON() {},
    } as DOMRect;
  };
  return () => {
    HTMLElement.prototype.getBoundingClientRect = original;
  };
}

describe('Tabs indicator width source per variant (Angular)', () => {
  // Regression test: the original implementation nested the underline
  // inside the tab's content span and only made that span a positioned
  // ancestor for `primary` (the `secondary` variant's underline escaped to
  // the full tab button). Collapsing both variants onto one full-tab-width
  // measurement silently dropped that distinction.
  it('measures the icon+label content, not the full tab, for the primary variant', () => {
    const restore = mockContentAndTabRects({ content: 40, tab: 200 });
    try {
      TestBed.configureTestingModule({ imports: [TabsVariantTestHost] });
      const fixture = TestBed.createComponent(TabsVariantTestHost);
      fixture.detectChanges();

      const indicator = fixture.nativeElement.querySelector(
        '.indicator',
      ) as HTMLElement;
      expect(indicator.style.width).toBe('40px');
    } finally {
      restore();
    }
  });

  it('measures the full tab, not just the content, for the secondary variant', () => {
    const restore = mockContentAndTabRects({ content: 40, tab: 200 });
    try {
      TestBed.configureTestingModule({ imports: [TabsVariantTestHost] });
      const fixture = TestBed.createComponent(TabsVariantTestHost);
      fixture.componentInstance.variant.set('secondary');
      fixture.detectChanges();

      const indicator = fixture.nativeElement.querySelector(
        '.indicator',
      ) as HTMLElement;
      expect(indicator.style.width).toBe('200px');
    } finally {
      restore();
    }
  });
});

@Component({
  standalone: true,
  imports: [Tab, Tabs, TabGroup, TabPanels, TabPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-tab-group
      [selectedTab]="selectedTab()"
      [defaultSelectedTab]="defaultSelectedTab()"
      (selectedTabChange)="selectedTabChanges.push($event)"
    >
      <udx-tabs>
        <udx-tab label="One" />
        <udx-tab label="Two" />
      </udx-tabs>
      <udx-tab-panels>
        <udx-tab-panel>First content</udx-tab-panel>
        <udx-tab-panel>Second content</udx-tab-panel>
      </udx-tab-panels>
    </udx-tab-group>
  `,
})
class TabGroupTestHost {
  readonly selectedTab = signal<number | null | undefined>(undefined);
  readonly defaultSelectedTab = signal<number | null>(0);
  readonly selectedTabChanges: (number | null)[] = [];
}

describe('TabGroup + Tabs + TabPanels (Angular)', () => {
  let fixture: ComponentFixture<TabGroupTestHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabGroupTestHost],
    }).compileComponents();
    fixture = TestBed.createComponent(TabGroupTestHost);
  });

  it('connects Tabs selection to the matching TabPanel via matching ids', () => {
    fixture.detectChanges();

    const tab = tabButton(fixture as any, 'One')!;
    const panel = fixture.nativeElement.querySelector(
      '[role="tabpanel"]:not([hidden])',
    ) as HTMLElement;

    expect(tab.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
    expect(panel.textContent).toContain('First content');
  });

  it('hides every panel except the one matching the selected tab', () => {
    fixture.detectChanges();

    tabButton(fixture as any, 'Two')!.click();
    fixture.detectChanges();

    const panels: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('[role="tabpanel"]'),
    );
    const hiddenPanels = panels.filter((panel) => panel.hidden);
    const visiblePanels = panels.filter((panel) => !panel.hidden);

    expect(visiblePanels).toHaveLength(1);
    expect(visiblePanels[0].textContent).toContain('Second content');
    expect(hiddenPanels).toHaveLength(1);
  });

  it('shares a controlled selection between Tabs and TabPanels', () => {
    fixture.componentInstance.selectedTab.set(0);
    fixture.detectChanges();

    tabButton(fixture as any, 'Two')!.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedTabChanges).toEqual([1]);
    // TabGroup is controlled: the host has not re-rendered with the new
    // value yet, so the first panel is still the visible one.
    const visiblePanel = fixture.nativeElement.querySelector(
      '[role="tabpanel"]:not([hidden])',
    ) as HTMLElement;
    expect(visiblePanel.textContent).toContain('First content');
  });
});
