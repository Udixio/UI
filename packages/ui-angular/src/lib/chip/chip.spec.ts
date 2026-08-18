import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Chip } from './chip';

describe('Chip', () => {
  let fixture: ComponentFixture<Chip>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Chip] }).compileComponents();
    fixture = TestBed.createComponent(Chip);
    fixture.componentRef.setInput('label', 'Filter');
  });

  it('owns an explicit uncontrolled selected state', () => {
    fixture.componentRef.setInput('defaultSelected', false);
    fixture.detectChanges();

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-pressed')).toBe('false');

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('does not expose pressed semantics for an action-only chip', () => {
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('button').hasAttribute('aria-pressed'),
    ).toBe(false);
  });

  it('keeps the historical single-surface rendering when removable', () => {
    fixture.componentRef.setInput('removable', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('button')).toHaveLength(1);
    expect(fixture.nativeElement.firstElementChild.tagName).toBe('BUTTON');
  });

  it('applies Material label-large typography to the label', () => {
    fixture.detectChanges();

    const label: HTMLSpanElement = Array.from<HTMLSpanElement>(
      fixture.nativeElement.querySelectorAll('span'),
    ).find((span) => span.textContent === 'Filter')!;
    expect(label).toBeTruthy();
    expect(label.className).toContain('text-label-large');
  });

  it('uses the shared Udixio selected icon and state-layer color', () => {
    fixture.componentRef.setInput(
      'icon',
      '<svg viewBox="0 0 24 24"><path d="M1 1" /></svg>',
    );
    fixture.componentRef.setInput('selected', true);
    fixture.detectChanges();

    const state = fixture.componentInstance as unknown as {
      stateColor: () => string;
      resolvedIcon: () => unknown;
    };
    expect(state.stateColor()).toBe(
      'on-secondary-container',
    );
    expect(state.resolvedIcon()).not.toBe(
      fixture.componentInstance.icon(),
    );
  });
});
