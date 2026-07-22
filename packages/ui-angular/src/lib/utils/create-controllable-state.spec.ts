import { signal } from '@angular/core';
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
});
