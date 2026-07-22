import { signal } from '@angular/core';
import { jest } from '@jest/globals';
import { createControllableState } from './create-controllable-state';

describe('createControllableState', () => {
  it('owns and updates an uncontrolled value', () => {
    const changes: boolean[] = [];
    const state = createControllableState({
      value: signal<boolean | undefined>(undefined),
      defaultValue: signal(true),
      onChange: (value) => changes.push(value),
    });
    state.initialize();

    state.set(false);

    expect(state.value()).toBe(false);
    expect(changes).toEqual([false]);
  });

  it('requests a controlled update without mutating the value', () => {
    const controlled = signal<boolean | undefined>(false);
    const changes: boolean[] = [];
    const state = createControllableState({
      value: controlled,
      defaultValue: signal(true),
      onChange: (value) => changes.push(value),
    });
    state.initialize();

    state.set(true);

    expect(state.value()).toBe(false);
    expect(changes).toEqual([true]);

    controlled.set(true);
    expect(state.value()).toBe(true);
  });

  it('only reads defaultValue during initialization', () => {
    const defaultValue = signal(false);
    const state = createControllableState({
      value: signal<boolean | undefined>(undefined),
      defaultValue,
    });
    state.initialize();

    defaultValue.set(true);

    expect(state.value()).toBe(false);
  });

  it('reports a controlled-mode change once', () => {
    const controlled = signal<boolean | undefined>(undefined);
    const errorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const state = createControllableState({
      value: controlled,
      defaultValue: signal(false),
      componentName: 'Fixture',
      stateName: 'checked',
    });
    state.initialize();

    controlled.set(true);
    expect(state.value()).toBe(true);
    controlled.set(undefined);
    expect(state.value()).toBe(false);

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        '<Fixture> changed checked from uncontrolled to controlled',
      ),
    );
    errorSpy.mockRestore();
  });
});
