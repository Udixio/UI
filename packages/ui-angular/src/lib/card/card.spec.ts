import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Card } from './card';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [Card],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-card interactive (click)="actions = actions + 1">
      <p>Open project</p>
    </lib-card>
  `,
})
class InteractiveCardHost {
  actions = 0;
}

@Component({
  standalone: true,
  imports: [Card],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-card href="/projects/aurora" target="_blank" rel="noreferrer">
      <p>Project Aurora</p>
    </lib-card>
  `,
})
class LinkCardHost {}

@Component({
  standalone: true,
  imports: [Card],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main>
      <lib-card><p>Static content</p></lib-card>
      <lib-card interactive><p>Actionable content</p></lib-card>
      <lib-card href="/somewhere"><p>Linked content</p></lib-card>
    </main>
  `,
})
class AccessibilityCardHost {}

describe('Card (Angular, consuming @udixio/core)', () => {
  let fixture: ComponentFixture<Card>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Card, InteractiveCardHost, LinkCardHost, AccessibilityCardHost],
    }).compileComponents();
    fixture = TestBed.createComponent(Card);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders a plain container without action semantics or state layer', () => {
    fixture.detectChanges();

    const card: HTMLDivElement = fixture.nativeElement.querySelector('div');
    expect(card.getAttribute('role')).toBeNull();
    expect(card.getAttribute('tabindex')).toBeNull();
    expect(card.querySelector('.state-layer')).toBeNull();
    expect(card.className).toContain('border-outline-variant');
  });

  it('applies the shared Tailwind classes from @udixio/core for every variant', () => {
    fixture.detectChanges();
    const card: HTMLDivElement = fixture.nativeElement.querySelector('div');
    expect(card.className).toContain('border-outline-variant');

    fixture.componentRef.setInput('variant', 'elevated');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('div').className).toContain(
      'shadow-1',
    );

    fixture.componentRef.setInput('variant', 'filled');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('div').className).toContain(
      'bg-surface-container-highest',
    );
  });

  it('exposes the resolved state to a className function', () => {
    fixture.componentRef.setInput('interactive', true);
    fixture.componentRef.setInput(
      'className',
      ({ interactive }: { interactive?: boolean }) => ({
        card: interactive ? 'custom-actionable' : 'custom-static',
      }),
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('div').className).toContain(
      'custom-actionable',
    );
  });

  it('renders button semantics, focusability, and a state layer when interactive', () => {
    fixture.componentRef.setInput('interactive', true);
    fixture.detectChanges();

    const card: HTMLDivElement = fixture.nativeElement.querySelector('div');
    expect(card.getAttribute('role')).toBe('button');
    expect(card.getAttribute('tabindex')).toBe('0');
    expect(card.className).toContain('cursor-pointer');
    expect(card.querySelector('.state-layer')).not.toBeNull();
  });

  it('activates an interactive card with Enter and Space like a native button', () => {
    const hostFixture = TestBed.createComponent(InteractiveCardHost);
    hostFixture.detectChanges();
    const card: HTMLDivElement =
      hostFixture.nativeElement.querySelector('[role="button"]');

    card.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    hostFixture.detectChanges();
    expect(hostFixture.componentInstance.actions).toBe(1);

    const spaceDown = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
      cancelable: true,
    });
    card.dispatchEvent(spaceDown);
    hostFixture.detectChanges();
    expect(spaceDown.defaultPrevented).toBe(true);
    expect(hostFixture.componentInstance.actions).toBe(1);

    card.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }));
    hostFixture.detectChanges();
    expect(hostFixture.componentInstance.actions).toBe(2);

    card.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'a', bubbles: true }),
    );
    hostFixture.detectChanges();
    expect(hostFixture.componentInstance.actions).toBe(2);
  });

  it('renders a native link with the interactive treatment when href is set', () => {
    const hostFixture = TestBed.createComponent(LinkCardHost);
    hostFixture.detectChanges();

    const link: HTMLAnchorElement =
      hostFixture.nativeElement.querySelector('a');
    expect(link.getAttribute('href')).toBe('/projects/aurora');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noreferrer');
    expect(link.getAttribute('role')).toBeNull();
    expect(link.className).toContain('cursor-pointer');
    expect(link.querySelector('.state-layer')).not.toBeNull();
    expect(link.textContent).toContain('Project Aurora');
  });

  it('has no axe violations across container, interactive, and link renders', async () => {
    const hostFixture = TestBed.createComponent(AccessibilityCardHost);
    hostFixture.detectChanges();

    expect(await axe(hostFixture.nativeElement)).toHaveNoViolations();
  });
});
