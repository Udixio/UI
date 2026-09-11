import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Badge } from './badge';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [Badge],
  template: `
    <i
      data-testid="icon"
      [udxBadge]="label"
      [udxBadgeMax]="max"
      [udxBadgeDescription]="description"
    ></i>
  `,
})
class Harness {
  label: string | number | undefined = undefined;
  max: number | undefined = undefined;
  description: string | undefined = 'Unread';
}

@Component({
  standalone: true,
  imports: [Badge],
  template: `<i data-testid="icon" udxBadge="100" udxBadgeMax="99"></i>`,
})
class StaticHarness {}

// `udx-icon` hosts itself with `display: contents` and re-renders its own
// content when the icon changes; this stands in for it without pulling the
// icon pipeline into the badge's tests.
@Component({
  standalone: true,
  imports: [Badge],
  template: `
    <fake-icon style="display: contents" [udxBadge]="3">
      <span data-testid="box" [innerHTML]="markup"></span>
    </fake-icon>
  `,
})
class ContentsHarness {
  markup = '<b>first</b>';
}

@Component({
  standalone: true,
  imports: [Badge],
  template: `
    @if (marked) {
      <i data-testid="icon" udxBadge></i>
    } @else {
      <i data-testid="icon"></i>
    }
  `,
})
class ToggleHarness {
  marked = true;
}

/**
 * Mirrors packages/ui-react/src/tests/Badge.spec.tsx scenario for scenario:
 * the two adapters render the same contract, so they are held to the same
 * assertions. What differs is the delivery shape -- React wraps, Angular
 * marks in place -- so the attachment itself is covered here on its own.
 */
describe('Badge (Angular)', () => {
  const iconOf = (root: HTMLElement) =>
    root.querySelector('[data-testid="icon"]') as HTMLElement;
  const badgeOf = (root: HTMLElement) =>
    root.querySelector('udx-badge-surface > span') as HTMLElement;

  // The badge holds two texts: the visible label, and the visually hidden
  // sentence the live region announces. Assertions must not confuse them.
  const visibleTextOf = (root: HTMLElement) =>
    (
      root.querySelector('udx-badge-surface [aria-hidden="true"]')?.textContent ??
      ''
    ).trim();

  it('marks the element it sits on, which needs no positioning of its own', () => {
    const fixture = TestBed.createComponent(Harness);
    fixture.detectChanges();

    const icon = iconOf(fixture.nativeElement);
    const badge = badgeOf(fixture.nativeElement);
    expect(badge).not.toBeNull();
    expect(icon.contains(badge)).toBe(true);
    expect(icon.style.position).toBe('relative');
    fixture.destroy();
  });

  it('places the badge inside the first box of a display: contents host', () => {
    const fixture = TestBed.createComponent(ContentsHarness);
    fixture.detectChanges();

    const box = fixture.nativeElement.querySelector('[data-testid="box"]');
    const badge = badgeOf(fixture.nativeElement);
    expect(box.contains(badge)).toBe(true);
    expect(box.style.position).toBe('relative');
    expect(fixture.nativeElement.querySelector('fake-icon').style.position).toBe('');
    fixture.destroy();
  });

  it('puts the badge back when the marked element re-renders its content', () => {
    const fixture = TestBed.createComponent(ContentsHarness);
    fixture.detectChanges();
    const box = fixture.nativeElement.querySelector('[data-testid="box"]');

    fixture.componentInstance.markup = '<b>second</b>';
    fixture.detectChanges();

    expect(box.textContent).toContain('second');
    expect(box.contains(badgeOf(fixture.nativeElement))).toBe(true);
    fixture.destroy();
  });

  it('removes the badge and its positioning when the directive goes away', () => {
    const fixture = TestBed.createComponent(ToggleHarness);
    fixture.detectChanges();
    expect(badgeOf(fixture.nativeElement)).not.toBeNull();

    fixture.componentInstance.marked = false;
    fixture.detectChanges();

    expect(badgeOf(fixture.nativeElement)).toBeNull();
    expect(iconOf(fixture.nativeElement).style.position).toBe('');
    fixture.destroy();
  });

  it('renders the small dot when there is nothing to show', () => {
    const fixture = TestBed.createComponent(Harness);
    fixture.detectChanges();

    const badge = badgeOf(fixture.nativeElement);
    expect(visibleTextOf(fixture.nativeElement)).toBe('');
    expect(badge.className).toContain('size-1.5');
    expect(badge.className).not.toContain('h-4');
    fixture.destroy();
  });

  it('renders the large pill as soon as there is a label', () => {
    const fixture = TestBed.createComponent(Harness);
    fixture.componentInstance.label = 3;
    fixture.detectChanges();

    const badge = badgeOf(fixture.nativeElement);
    expect(visibleTextOf(fixture.nativeElement)).toBe('3');
    expect(badge.className).toContain('h-4');
    expect(badge.className).not.toContain('size-1.5');
    fixture.destroy();
  });

  it('caps a count the way Material spells it', () => {
    const fixture = TestBed.createComponent(Harness);
    fixture.componentInstance.label = 100;
    fixture.componentInstance.max = 99;
    fixture.detectChanges();

    expect(visibleTextOf(fixture.nativeElement)).toBe('99+');
    fixture.destroy();
  });

  it('reads a static attribute as the count it spells', () => {
    const fixture = TestBed.createComponent(StaticHarness);
    fixture.detectChanges();

    expect(visibleTextOf(fixture.nativeElement)).toBe('99+');
    fixture.destroy();
  });

  it('shows a zero count rather than treating it as absent', () => {
    const fixture = TestBed.createComponent(Harness);
    fixture.componentInstance.label = 0;
    fixture.detectChanges();

    const badge = badgeOf(fixture.nativeElement);
    expect(visibleTextOf(fixture.nativeElement)).toBe('0');
    expect(badge.className).toContain('h-4');
    fixture.destroy();
  });

  it('uses logical offsets, which is what flips it for right-to-left', () => {
    const fixture = TestBed.createComponent(Harness);
    fixture.componentInstance.label = 3;
    fixture.detectChanges();

    const badge = badgeOf(fixture.nativeElement).className;
    expect(badge).toContain('start-[calc(100%-12px)]');
    expect(badge).not.toContain('left-[');
    expect(badge).not.toContain('right-[');
    fixture.destroy();
  });

  it('announces the meaning, not the bare digit', () => {
    const fixture = TestBed.createComponent(Harness);
    fixture.componentInstance.label = 3;
    fixture.componentInstance.description = '3 unread messages';
    fixture.detectChanges();

    const badge = badgeOf(fixture.nativeElement);
    // A live region announces its content, not its label, so the sentence is
    // content and the element carries no aria-label.
    expect(badge.getAttribute('role')).toBe('status');
    expect(badge.getAttribute('aria-label')).toBeNull();
    expect(badge.textContent).toContain('3 unread messages');
    fixture.destroy();
  });

  it('hides itself from assistive tech when it has no description', () => {
    const fixture = TestBed.createComponent(Harness);
    fixture.componentInstance.label = 3;
    fixture.componentInstance.description = undefined;
    fixture.detectChanges();

    const badge = badgeOf(fixture.nativeElement);
    expect(badge.getAttribute('role')).toBeNull();
    expect(badge.getAttribute('aria-hidden')).toBe('true');
    fixture.destroy();
  });

  it('uses the error colour roles Material mandates', () => {
    const fixture = TestBed.createComponent(Harness);
    fixture.componentInstance.label = 3;
    fixture.detectChanges();

    const badge = badgeOf(fixture.nativeElement).className;
    expect(badge).toContain('bg-error');
    expect(badge).toContain('text-on-error');
    fixture.destroy();
  });

  it('has no automated accessibility violations', async () => {
    const fixture = TestBed.createComponent(Harness);
    fixture.componentInstance.label = 3;
    fixture.componentInstance.description = '3 unread messages';
    fixture.detectChanges();

    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
    fixture.destroy();
  });

  // Mirrors the React guard: a `max-w` with `truncate` rendered `999+` as
  // `99...` in the browser before any test noticed.
  it('never clamps or truncates its label', () => {
    const fixture = TestBed.createComponent(Harness);
    fixture.componentInstance.label = 'BETA RELEASE';
    fixture.detectChanges();

    const badge = badgeOf(fixture.nativeElement);
    expect(visibleTextOf(fixture.nativeElement)).toBe('BETA RELEASE');
    expect(badge.className).not.toContain('max-w-');
    expect(badge.querySelector('span')?.className).not.toContain('truncate');
    fixture.destroy();
  });
});
