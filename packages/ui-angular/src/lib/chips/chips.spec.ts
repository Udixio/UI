import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Chips } from './chips';

describe('Chips', () => {
  let fixture: ComponentFixture<Chips>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Chips],
    }).compileComponents();
    fixture = TestBed.createComponent(Chips);
    fixture.componentRef.setInput('label', 'Filters');
    fixture.componentRef.setInput('items', [
      { id: 'a', label: 'Action' },
      { id: 'b', label: 'Filter', selected: false },
    ]);
  });

  it('renders a labelled list without assigning selection to action items', () => {
    fixture.detectChanges();
    const buttons: HTMLButtonElement[] = [
      ...fixture.nativeElement.querySelectorAll('button'),
    ];

    expect(
      fixture.nativeElement
        .querySelector('[role=list]')
        .getAttribute('aria-label'),
    ).toBe('Filters');
    expect(buttons[0].hasAttribute('aria-pressed')).toBe(false);
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');
  });
});
