import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { ValueBinding, ValueRef } from '@udixio/motion';
import { valuesModule } from '@udixio/motion';
import { defineValue } from '@udixio/motion/value';
import { MotionValue } from './motion-value';

// The core binding is replaced for the whole file; the definitions stay real.

const valueMock = jest.spyOn(valuesModule()!, 'value');

defineValue('tilt', { source: 'state', spring: 'none' });
defineValue('tilt-b', { source: 'state', spring: 'none' });

/**
 * A stand-in for one bound value, as the core binds it: `emit` writes a frame and calls the listeners that follow each
 * frame; `settle` reports a rest or a change of target to the listeners that do not follow each frame.
 */
function fakeValue(name: string) {
  const frameListeners = new Set<(next: number) => void>();
  const settledListeners = new Set<(next: number) => void>();
  let current = 0;
  const binding = {
    name,
    set: jest.fn(),
    subscribe: jest.fn((listener: (next: number) => void, options?: { perFrame?: boolean }) => {
      const listeners = options?.perFrame === false ? settledListeners : frameListeners;
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }),
    destroy: jest.fn(() => {
      frameListeners.clear();
      settledListeners.clear();
    }),
    get current() {
      return current;
    },
  };
  return {
    binding,
    listeners: frameListeners,
    emit(next: number) {
      current = next;
      for (const listener of [...frameListeners]) listener(next);
    },
    settle(next: number) {
      current = next;
      for (const listener of [...settledListeners]) listener(next);
    },
  };
}

type Fake = ReturnType<typeof fakeValue>;
let fakes: Fake[] = [];

beforeEach(() => {
  fakes = [];
  valueMock.mockReset();
  valueMock.mockImplementation((_element, source) => {
    const name = typeof source === 'string' ? source : source.name;
    const fake = fakeValue(name);
    fakes.push(fake);
    return fake.binding as unknown as ValueBinding;
  });
});

const boxOf = (root: HTMLElement): HTMLElement => {
  const box = root.querySelector<HTMLElement>('[data-testid="box"]');
  if (!box) throw new Error('the test box is not in the DOM');
  return box;
};

function directiveOf<T>(fixture: ComponentFixture<T>): MotionValue {
  return fixture.debugElement.query(By.directive(MotionValue)).injector.get(MotionValue);
}

@Component({
  standalone: true,
  imports: [MotionValue],
  template: `
    <div
      data-testid="box"
      [udxMotionValue]="source"
      (udxMotionValueChange)="changes.push($event)"
    ></div>
  `,
})
class ValueHost {
  source: ValueRef | string = 'tilt';
  changes: number[] = [];
}

@Component({
  standalone: true,
  imports: [MotionValue],
  template: `<div data-testid="box" udxMotionValue="tilt"></div>`,
})
class StaticValueHost {}

describe('MotionValue (Angular directive)', () => {
  it('binds the named value to its host after render, by its name', () => {
    const fixture = TestBed.createComponent(ValueHost);
    fixture.detectChanges();

    expect(valueMock).toHaveBeenCalledTimes(1);
    expect(valueMock).toHaveBeenCalledWith(boxOf(fixture.nativeElement), 'tilt');
    fixture.destroy();
  });

  it('binds nothing before the first render', () => {
    const fixture = TestBed.createComponent(ValueHost);

    expect(valueMock).not.toHaveBeenCalled();
    expect(directiveOf(fixture).get()).toBeUndefined();
    fixture.destroy();
  });

  it('forwards set to the binding, and get reads the number the binding holds', () => {
    const fixture = TestBed.createComponent(ValueHost);
    fixture.detectChanges();
    const tilt = directiveOf(fixture);

    tilt.set(0.5);
    expect(fakes[0].binding.set).toHaveBeenCalledWith(0.5);

    fakes[0].emit(0.25);
    expect(tilt.get()).toBe(0.25);
    fixture.destroy();
  });

  it('ignores set before the first render', () => {
    const fixture = TestBed.createComponent(ValueHost);

    expect(() => directiveOf(fixture).set(0.5)).not.toThrow();
    fixture.destroy();
  });

  it('delivers the values to a listener registered before the element is bound', () => {
    const listener = jest.fn();
    const fixture = TestBed.createComponent(ValueHost);
    directiveOf(fixture).subscribe(listener);

    fixture.detectChanges();
    fakes[0].emit(0.3);

    expect(listener).toHaveBeenCalledWith(0.3);
    fixture.destroy();
  });

  it('emits udxMotionValueChange when the value comes to rest or its target changes, not on each frame', () => {
    const fixture = TestBed.createComponent(ValueHost);
    fixture.detectChanges();

    fakes[0].emit(0.1);
    fakes[0].emit(0.2);
    expect(fixture.componentInstance.changes).toEqual([]);

    fakes[0].settle(0.2);
    fakes[0].settle(0.6);
    expect(fixture.componentInstance.changes).toEqual([0.2, 0.6]);
    fixture.destroy();
  });

  it('keeps the frames for a subscriber, which follows each number after the element is bound', () => {
    const frames = jest.fn();
    const fixture = TestBed.createComponent(ValueHost);
    const tilt = directiveOf(fixture);
    fixture.detectChanges();
    const unsubscribe = tilt.subscribe(frames);

    fakes[0].emit(0.1);
    fakes[0].emit(0.2);
    unsubscribe();
    fakes[0].emit(0.3);

    expect(frames.mock.calls).toEqual([[0.1], [0.2]]);
    fixture.destroy();
  });

  it('binds again, and destroys the old binding, when the source changes', () => {
    const fixture = TestBed.createComponent(ValueHost);
    fixture.detectChanges();

    fixture.componentInstance.source = 'tilt-b';
    fixture.detectChanges();

    expect(fakes[0].binding.destroy).toHaveBeenCalledTimes(1);
    expect(valueMock).toHaveBeenCalledTimes(2);
    expect(valueMock).toHaveBeenLastCalledWith(boxOf(fixture.nativeElement), 'tilt-b');
    fixture.destroy();
  });

  it('destroys the binding when the directive is destroyed', () => {
    const fixture = TestBed.createComponent(StaticValueHost);
    fixture.detectChanges();

    fixture.destroy();

    expect(fakes[0].binding.destroy).toHaveBeenCalledTimes(1);
  });

  it('waits for a value defined after the render, then binds it, and throws nothing before', () => {
    const fixture = TestBed.createComponent(ValueHost);
    fixture.componentInstance.source = 'tilt-later';
    expect(() => fixture.detectChanges()).not.toThrow();

    expect(valueMock).not.toHaveBeenCalled();

    defineValue('tilt-later', { source: 'state', spring: 'none' });

    expect(valueMock).toHaveBeenCalledWith(boxOf(fixture.nativeElement), expect.objectContaining({ name: 'tilt-later' }));
    fixture.destroy();
  });
});
