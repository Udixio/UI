import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Search } from './search';
import { IconButton } from '../icon-button/icon-button';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [Search],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-search
      label="Search"
      [defaultExpanded]="true"
      (queryChange)="queries.push($event)"
    >
      <div role="option" aria-selected="false" tabindex="-1">Alpha</div>
      <div role="option" aria-selected="false" tabindex="-1">Beta</div>
    </udx-search>
  `,
})
class SearchResultsHost {
  queries: string[] = [];
}

@Component({
  standalone: true,
  imports: [Search],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-search
      label="Search"
      [query]="query"
      [expanded]="expanded"
      (queryChange)="queryChanges.push($event)"
      (expandedChange)="expandedChanges.push($event)"
    />
  `,
})
class ControlledSearchHost {
  query = 'initial';
  expanded = false;
  queryChanges: string[] = [];
  expandedChanges: boolean[] = [];
}

@Component({
  standalone: true,
  imports: [Search],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-search label="Search" [defaultQuery]="query" [defaultExpanded]="true">
      <div role="option" aria-selected="false" tabindex="-1">Alpha</div>
    </udx-search>
  `,
})
class DefaultSearchHost {
  query = 'material';
}

@Component({
  standalone: true,
  imports: [IconButton, Search],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-search label="Search" [clearable]="false">
      <udx-icon-button
        search-trailing
        label="Open filters"
        [icon]="icon"
        [tooltip]="false"
        (click)="actions += 1"
      />
    </udx-search>
  `,
})
class SearchTrailingActionsHost {
  icon = '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>';
  actions = 0;
}

@Component({
  standalone: true,
  imports: [Search],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-search label="Search" [defaultExpanded]="true">
      @if (showResults()) {
        <div role="option" aria-selected="false" tabindex="-1">Alpha</div>
      }
    </udx-search>
  `,
})
class DynamicSearchHost {
  showResults = signal(false);
}

describe('Search (Angular)', () => {
  let fixture: ComponentFixture<Search>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Search,
        SearchResultsHost,
        ControlledSearchHost,
        DefaultSearchHost,
        SearchTrailingActionsHost,
        DynamicSearchHost,
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Search);
    fixture.componentRef.setInput('label', 'Search');
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('renders a named native searchbox and owns an uncontrolled query', () => {
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    const changes: string[] = [];
    fixture.componentInstance.queryChange.subscribe((value) =>
      changes.push(value),
    );

    expect(input.getAttribute('type')).toBe('search');
    expect(input.getAttribute('aria-label')).toBe('Search');
    input.value = 'material';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(input.value).toBe('material');
    expect(changes).toEqual(['material']);
  });

  it('keeps an empty results surface hidden when the input receives focus', () => {
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    const results = fixture.nativeElement.querySelector(
      '[id$="-results"]',
    ) as HTMLDivElement;

    input.focus();
    fixture.detectChanges();

    expect(results.hasAttribute('hidden')).toBe(true);
    expect(results.getAttribute('aria-hidden')).toBe('true');
    expect(results.getAttribute('role')).toBeNull();
  });

  it('uses the shared M3 focus indicator and state layers for built-in actions', () => {
    const root = fixture.nativeElement.querySelector(
      '[role="search"]',
    ) as HTMLElement;
    const container = root.querySelector('.container') as HTMLElement;
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    const leading = fixture.nativeElement.querySelector(
      'span[aria-hidden="true"].size-12',
    ) as HTMLElement;

    expect(leading.getAttribute('aria-hidden')).toBe('true');
    expect(leading.className).toContain('pointer-events-none');
    expect(leading.className).toContain('size-12');
    expect(leading.querySelector('udx-state-layer')).toBeNull();
    expect(
      fixture.nativeElement.querySelector('button[aria-label="Search"]'),
    ).toBeNull();

    leading.click();
    expect(document.activeElement).toBe(input);

    input.focus();
    fixture.detectChanges();
    expect(container.className).toContain('outline-[3px]');
    expect(container.className).toContain('outline-offset-2');
    expect(container.className).toContain('outline-secondary');

    const queryFixture = TestBed.createComponent(DefaultSearchHost);
    queryFixture.detectChanges();
    const clear = queryFixture.nativeElement.querySelector(
      'button[aria-label="Clear search"]',
    ) as HTMLButtonElement;
    expect(clear.querySelector('udx-state-layer')).not.toBeNull();
    queryFixture.destroy();
  });

  it('requests controlled query and expanded changes without mutating local state', () => {
    const hostFixture = TestBed.createComponent(ControlledSearchHost);
    hostFixture.detectChanges();

    const input = hostFixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    input.value = 'next';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new FocusEvent('focus'));
    hostFixture.detectChanges();

    // The parent has not accepted the controlled change yet; the component
    // emits the request and leaves reconciliation to the parent binding.
    expect(input.value).toBe('next');
    expect(input.getAttribute('aria-expanded')).toBeNull();
    expect(hostFixture.componentInstance.queryChanges).toEqual(['next']);
    expect(hostFixture.componentInstance.expandedChanges).toEqual([true]);
    hostFixture.destroy();
  });

  it('clears the query and closes on Escape', () => {
    const hostFixture = TestBed.createComponent(DefaultSearchHost);
    hostFixture.detectChanges();
    const input = hostFixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;

    expect(input.value).toBe('material');
    const clear = hostFixture.nativeElement.querySelector(
      'button[aria-label="Clear search"]',
    ) as HTMLButtonElement;
    clear.click();
    hostFixture.detectChanges();
    expect(input.value).toBe('');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    hostFixture.detectChanges();
    expect(input.getAttribute('aria-expanded')).toBe('false');
    hostFixture.destroy();
  });

  it('shares listbox focus navigation with React', async () => {
    const hostFixture = TestBed.createComponent(SearchResultsHost);
    hostFixture.detectChanges();
    await Promise.resolve();
    hostFixture.detectChanges();

    const input = hostFixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    const options =
      hostFixture.nativeElement.querySelectorAll('[role="option"]');
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    hostFixture.detectChanges();

    expect(document.activeElement).toBe(options[0]);
    options[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    expect(document.activeElement).toBe(options[1]);
    options[1].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await Promise.resolve();
    hostFixture.detectChanges();
    expect(document.activeElement).toBe(input);
    hostFixture.destroy();
  });

  it('closes the results surface on an outside pointer without closing inside the Search', async () => {
    const hostFixture = TestBed.createComponent(SearchResultsHost);
    hostFixture.detectChanges();
    await Promise.resolve();
    hostFixture.detectChanges();

    const input = hostFixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    const outside = document.createElement('button');
    document.body.append(outside);

    input.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    hostFixture.detectChanges();
    expect(input.getAttribute('aria-expanded')).toBe('true');

    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await Promise.resolve();
    hostFixture.detectChanges();
    expect(input.getAttribute('aria-expanded')).toBe('false');

    outside.remove();
    hostFixture.destroy();
  });

  it('projects interactive trailing actions through the named slot', () => {
    const hostFixture = TestBed.createComponent(SearchTrailingActionsHost);
    hostFixture.detectChanges();

    const action = hostFixture.nativeElement.querySelector(
      'button[aria-label="Open filters"]',
    ) as HTMLButtonElement;
    expect(action).not.toBeNull();

    action.click();
    expect(hostFixture.componentInstance.actions).toBe(1);
    hostFixture.destroy();
  });

  it('detects suggestions that arrive after an expanded search is mounted', async () => {
    const hostFixture = TestBed.createComponent(DynamicSearchHost);
    hostFixture.detectChanges();
    await Promise.resolve();
    hostFixture.detectChanges();

    const results = hostFixture.nativeElement.querySelector(
      '[id$="-results"]',
    ) as HTMLDivElement;
    expect(results.hasAttribute('hidden')).toBe(true);

    hostFixture.componentInstance.showResults.set(true);
    hostFixture.detectChanges();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    hostFixture.detectChanges();

    expect(results.hasAttribute('hidden')).toBe(false);
    expect(results.getAttribute('aria-hidden')).toBeNull();

    hostFixture.componentInstance.showResults.set(false);
    hostFixture.detectChanges();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    hostFixture.detectChanges();

    expect(results.hasAttribute('hidden')).toBe(true);
    expect(results.getAttribute('aria-hidden')).toBe('true');
    hostFixture.destroy();
  });

  it('has no automated accessibility violations', async () => {
    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
  });
});
