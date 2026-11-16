import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { GestureBinding, GestureRef } from '@udixio/motion';
import { gesturesModule } from '@udixio/motion';
import { defineGesture } from '@udixio/motion/gesture';
import { MotionGesture } from './motion-gesture';

// The core binding is replaced for the whole file; the definitions stay real.

const gestureMock = jest.spyOn(gesturesModule()!, 'gesture');

defineGesture('ng-drag', { kind: 'drag', bounds: 'none', alternative: 'arrows' });
defineGesture('ng-dismiss', { kind: 'swipe', alternative: 'action' });

/** A stand-in for one bound gesture: `reset` and `destroy` are what the directive calls. */
function fakeGesture(name: string) {
  const binding = {
    name,
    kind: 'drag' as const,
    offset: { x: 0, y: 0 },
    velocity: { x: 0, y: 0, source: 'estimated' as const },
    reset: jest.fn(),
    destroy: jest.fn(),
  };
  return { binding };
}

type Fake = ReturnType<typeof fakeGesture>;
let fakes: Fake[] = [];

beforeEach(() => {
  fakes = [];
  gestureMock.mockReset();
  gestureMock.mockImplementation((_element, source) => {
    const name = typeof source === 'string' ? source : source.name;
    const fake = fakeGesture(name);
    fakes.push(fake);
    return fake.binding as unknown as GestureBinding;
  });
});

const boxOf = (root: HTMLElement): HTMLElement => {
  const box = root.querySelector<HTMLElement>('[data-testid="box"]');
  if (!box) throw new Error('the test box is not in the DOM');
  return box;
};

function directiveOf<T>(fixture: ComponentFixture<T>): MotionGesture {
  return fixture.debugElement.query(By.directive(MotionGesture)).injector.get(MotionGesture);
}

/** An event of `type` with its detail, dispatched on the box of a fixture. */
function emit(fixture: ComponentFixture<unknown>, type: string, detail: unknown, cancelable = false): boolean {
  return boxOf(fixture.nativeElement).dispatchEvent(new CustomEvent(type, { detail, cancelable, bubbles: true }));
}

@Component({
  standalone: true,
  imports: [MotionGesture],
  template: `
    <div
      data-testid="box"
      [udxMotionGesture]="source"
      (udxDragEnd)="drags.push($event)"
      (udxSwipe)="swipes.push($event)"
      (udxReorder)="reorders.push($event)"
    ></div>
  `,
})
class GestureHost {
  source: GestureRef | string = 'ng-drag';
  drags: CustomEvent[] = [];
  swipes: CustomEvent[] = [];
  reorders: CustomEvent[] = [];
}

@Component({
  standalone: true,
  imports: [MotionGesture],
  template: `<div data-testid="box" udxMotionGesture="ng-drag"></div>`,
})
class StaticGestureHost {}

@Component({
  standalone: true,
  imports: [MotionGesture],
  template: `<div data-testid="box" udxMotionGesture="ng-dismiss" (udxSwipe)="$event.preventDefault()"></div>`,
})
class PreventingHost {}

describe('MotionGesture (Angular directive)', () => {
  it('binds the named gesture to its host after render, by its name', () => {
    const fixture = TestBed.createComponent(GestureHost);
    fixture.detectChanges();

    expect(gestureMock).toHaveBeenCalledTimes(1);
    expect(gestureMock).toHaveBeenCalledWith(boxOf(fixture.nativeElement), 'ng-drag');
    fixture.destroy();
  });

  it('binds nothing before the first render, and ignores reset', () => {
    const fixture = TestBed.createComponent(GestureHost);

    expect(gestureMock).not.toHaveBeenCalled();
    expect(() => directiveOf(fixture).reset()).not.toThrow();
    fixture.destroy();
  });

  it('forwards reset to the binding', () => {
    const fixture = TestBed.createComponent(GestureHost);
    fixture.detectChanges();

    directiveOf(fixture).reset();

    expect(fakes[0].binding.reset).toHaveBeenCalledTimes(1);
    fixture.destroy();
  });

  it('emits each gesture event on its output, with the event itself', () => {
    const fixture = TestBed.createComponent(GestureHost);
    fixture.detectChanges();

    emit(fixture, 'motion-dragend', { x: 12, y: 0 });
    emit(fixture, 'motion-swipe', { direction: 'end' }, true);
    emit(fixture, 'motion-reorder', { from: 0, to: 1 }, true);

    expect(fixture.componentInstance.drags.map((event) => event.detail)).toEqual([{ x: 12, y: 0 }]);
    expect(fixture.componentInstance.swipes.map((event) => event.type)).toEqual(['motion-swipe']);
    expect(fixture.componentInstance.reorders.map((event) => event.detail)).toEqual([{ from: 0, to: 1 }]);
    fixture.destroy();
  });

  it('lets an output handler prevent the swipe, through the event it receives', () => {
    const fixture = TestBed.createComponent(PreventingHost);
    fixture.detectChanges();

    expect(emit(fixture, 'motion-swipe', { direction: 'start' }, true)).toBe(false);
    fixture.destroy();
  });

  it('binds again, and destroys the old binding, when the source changes', () => {
    const fixture = TestBed.createComponent(GestureHost);
    fixture.detectChanges();

    fixture.componentInstance.source = 'ng-dismiss';
    fixture.detectChanges();

    expect(fakes[0].binding.destroy).toHaveBeenCalledTimes(1);
    expect(gestureMock).toHaveBeenCalledTimes(2);
    expect(gestureMock).toHaveBeenLastCalledWith(boxOf(fixture.nativeElement), 'ng-dismiss');
    fixture.destroy();
  });

  it('destroys the binding when the directive is destroyed', () => {
    const fixture = TestBed.createComponent(StaticGestureHost);
    fixture.detectChanges();

    fixture.destroy();

    expect(fakes[0].binding.destroy).toHaveBeenCalledTimes(1);
  });

  it('waits for a gesture defined after the render, then binds it, and throws nothing before', () => {
    const fixture = TestBed.createComponent(GestureHost);
    fixture.componentInstance.source = 'ng-later';
    expect(() => fixture.detectChanges()).not.toThrow();

    expect(gestureMock).not.toHaveBeenCalled();

    defineGesture('ng-later', { kind: 'drag', alternative: 'arrows' });

    expect(gestureMock).toHaveBeenCalledWith(boxOf(fixture.nativeElement), expect.objectContaining({ name: 'ng-later' }));
    fixture.destroy();
  });
});
