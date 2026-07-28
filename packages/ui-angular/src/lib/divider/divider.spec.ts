import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Divider } from './divider';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [Divider],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main>
      <lib-divider />
      <lib-divider orientation="vertical" />
    </main>
  `,
})
class AccessibilityDividerHost {}

describe('Divider (Angular, consuming @udixio/core)', () => {
  let fixture: ComponentFixture<Divider>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Divider, AccessibilityDividerHost],
    }).compileComponents();
    fixture = TestBed.createComponent(Divider);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders a native hr with the horizontal treatment by default', () => {
    fixture.detectChanges();

    const divider: HTMLHRElement = fixture.nativeElement.querySelector('hr');
    expect(divider).not.toBeNull();
    expect(divider.className).toContain('border-t');
    expect(divider.getAttribute('aria-orientation')).toBeNull();
  });

  it('applies the vertical treatment and aria-orientation when requested', () => {
    fixture.componentRef.setInput('orientation', 'vertical');
    fixture.detectChanges();

    const divider: HTMLHRElement = fixture.nativeElement.querySelector('hr');
    expect(divider.className).toContain('border-l');
    expect(divider.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('exposes the resolved state to a className function', () => {
    fixture.componentRef.setInput('orientation', 'vertical');
    fixture.componentRef.setInput(
      'className',
      ({ orientation }: { orientation?: string }) => ({
        divider:
          orientation === 'vertical' ? 'custom-vertical' : 'custom-horizontal',
      }),
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('hr').className).toContain(
      'custom-vertical',
    );
  });

  it('has no axe violations in either orientation', async () => {
    const hostFixture = TestBed.createComponent(AccessibilityDividerHost);
    hostFixture.detectChanges();

    expect(await axe(hostFixture.nativeElement)).toHaveNoViolations();
  });
});
