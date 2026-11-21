import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { defineGesture, getGesture } from '@udixio/motion/gesture';
import { MotionGesture } from './motion-gesture';

// Nothing is mocked here: the gesture runs through the real binding.
defineGesture('ng-drag-real', { type: 'drag', bounds: 'none', alternative: 'arrows' });

@Component({
  standalone: true,
  imports: [MotionGesture],
  template: `<div data-testid="box" udxMotionGesture="ng-drag-real"></div>`,
})
class DragHost {}

/** A pointer event of `type` at `x` on an element. jsdom has no PointerEvent, so a MouseEvent carries the pointer fields. */
function pointer(el: Element, type: 'pointerdown' | 'pointermove' | 'pointerup', x: number): void {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: 0, button: 0 });
  Object.defineProperties(event, { pointerId: { value: 1 }, isPrimary: { value: true } });
  el.dispatchEvent(event);
}

describe('MotionGesture (Angular directive, real binding)', () => {
  it('follows a synthetic pointer drag with its host, and holds the offset of the pointer', () => {
    const fixture = TestBed.createComponent(DragHost);
    fixture.detectChanges();
    const box = fixture.nativeElement.querySelector('[data-testid="box"]') as HTMLElement;
    expect(fixture.debugElement.query(By.directive(MotionGesture))).toBeDefined();

    pointer(box, 'pointerdown', 10);
    pointer(box, 'pointermove', 60);

    expect(getGesture(box)?.offset).toEqual({ x: 50, y: 0 });
    pointer(box, 'pointerup', 60);
    fixture.destroy();
  });
});
