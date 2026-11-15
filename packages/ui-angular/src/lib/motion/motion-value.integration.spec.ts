import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { defineValue } from '@udixio/motion/value';
import { MotionValue } from './motion-value';

// Nothing is mocked here: the value runs through the real core binding.
defineValue('tilt-test', { source: 'state', spring: 'none' });

@Component({
  standalone: true,
  imports: [MotionValue],
  template: `<div data-testid="box" udxMotionValue="tilt-test"></div>`,
})
class TiltHost {}

describe('MotionValue (Angular directive, real core)', () => {
  it('writes a state value as the CSS variable of its host, through set', () => {
    const fixture = TestBed.createComponent(TiltHost);
    fixture.detectChanges();
    const box = fixture.nativeElement.querySelector('[data-testid="box"]') as HTMLElement;
    const tilt = fixture.debugElement.query(By.directive(MotionValue)).injector.get(MotionValue);

    tilt.set(0.5);

    expect(box.style.getPropertyValue('--udx-motion-value-tilt-test')).toBe('0.5');
    fixture.destroy();
  });
});
