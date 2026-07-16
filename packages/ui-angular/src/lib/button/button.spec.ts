import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Button } from './button';

describe('Button (Angular, consuming @udixio/core)', () => {
  let fixture: ComponentFixture<Button>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Button],
    }).compileComponents();
    fixture = TestBed.createComponent(Button);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('applies the shared Tailwind classes from @udixio/core (filled variant)', () => {
    fixture.componentRef.setInput('label', 'Envoyer');
    fixture.detectChanges();

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    // Classes produced by @udixio/core's buttonStyle — same source as React.
    expect(button.className).toContain('bg-primary');
    expect(button.className).toContain('text-on-primary');
    expect(button.textContent?.trim()).toBe('Envoyer');
  });

  it('toggles isActive on click when toggleable', () => {
    fixture.componentRef.setInput('toggleable', true);
    const emitted: boolean[] = [];
    fixture.componentInstance.toggled.subscribe((v) => emitted.push(v));
    fixture.detectChanges();

    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();

    expect(emitted).toEqual([true]);
  });
});
