import { flushSync } from 'svelte';
import { createControllableState } from './create-controllable-state.svelte';

/**
 * Runes only track inside a reactive context; `$effect.root` gives the spec
 * one without mounting a component, and `flushSync` settles the graph.
 */
function inRoot<T>(run: () => T): { result: T; dispose: () => void } {
  let result!: T;
  const dispose = $effect.root(() => {
    result = run();
  });
  return { result, dispose };
}

describe('createControllableState', () => {
  it('owns and updates an uncontrolled value', () => {
    const changes: boolean[] = [];
    const { result: state, dispose } = inRoot(() =>
      createControllableState({
        value: () => undefined,
        defaultValue: () => true,
        onChange: (value) => changes.push(value),
      }),
    );

    state.set(false);
    flushSync();

    expect(state.current).toBe(false);
    expect(changes).toEqual([false]);
    dispose();
  });

  it('requests a controlled update through assign without mutating locally', () => {
    let controlled = $state<boolean | undefined>(false);
    const changes: boolean[] = [];
    const assigned: boolean[] = [];
    const { result: state, dispose } = inRoot(() =>
      createControllableState({
        value: () => controlled,
        defaultValue: () => true,
        onChange: (value) => changes.push(value),
        assign: (value) => assigned.push(value),
      }),
    );

    state.set(true);
    flushSync();

    // The owner was asked twice -- callback and assignment -- and ignored both.
    expect(state.current).toBe(false);
    expect(changes).toEqual([true]);
    expect(assigned).toEqual([true]);

    controlled = true;
    flushSync();
    expect(state.current).toBe(true);
    dispose();
  });

  it('never calls assign in uncontrolled mode', () => {
    const assigned: boolean[] = [];
    const { result: state, dispose } = inRoot(() =>
      createControllableState({
        value: () => undefined,
        defaultValue: () => false,
        assign: (value) => assigned.push(value),
      }),
    );

    state.set(true);
    flushSync();

    expect(state.current).toBe(true);
    expect(assigned).toEqual([]);
    dispose();
  });

  it('only reads defaultValue during initialization', () => {
    let defaultValue = $state(false);
    const { result: state, dispose } = inRoot(() =>
      createControllableState({
        value: () => undefined,
        defaultValue: () => defaultValue,
      }),
    );

    defaultValue = true;
    flushSync();

    expect(state.current).toBe(false);
    dispose();
  });

  it('ignores a set that resolves to the current value', () => {
    const changes: number[] = [];
    const { result: state, dispose } = inRoot(() =>
      createControllableState({
        value: () => undefined,
        defaultValue: () => 1,
        onChange: (value) => changes.push(value),
      }),
    );

    state.set((current) => current);
    flushSync();

    expect(changes).toEqual([]);
    dispose();
  });

  it('reports a controlled-mode change once', () => {
    let controlled = $state<boolean | undefined>(undefined);
    const errorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const { result: state, dispose } = inRoot(() =>
      createControllableState({
        value: () => controlled,
        defaultValue: () => false,
        componentName: 'Fixture',
        stateName: 'checked',
      }),
    );

    controlled = true;
    flushSync();
    expect(state.current).toBe(true);
    controlled = undefined;
    flushSync();
    expect(state.current).toBe(false);

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        '<Fixture> changed checked from uncontrolled to controlled',
      ),
    );
    errorSpy.mockRestore();
    dispose();
  });
});
