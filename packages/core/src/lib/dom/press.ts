/** Calls back when an element is pressed by a primary pointer or by the keyboard, and when that press ends. */
export type PressStart = (event: PointerEvent | KeyboardEvent) => (() => void) | void;

/**
 * Starts a press on an element: a primary pointer down on it, or Enter or Space pressed while it has focus. `onStart`
 * receives the starting event and may return a callback that runs when the press ends (the pointer is released or
 * cancelled, or the key is released or the element loses focus). A press does not start while one is active on the
 * element. Returns the function that detaches the element: a press in progress is then dropped without its callback.
 */
export function press(element: HTMLElement, onStart: PressStart): () => void {
  const view = element.ownerDocument.defaultView ?? window;
  let end: (() => void) | undefined;
  let active = false;
  let detachPress: (() => void) | undefined;

  /** Ends the press in progress and runs its callback once. */
  const finish = (): void => {
    if (!active) return;
    active = false;
    detachPress?.();
    detachPress = undefined;
    const callback = end;
    end = undefined;
    callback?.();
  };

  /** Starts a press for `event`, then listens for the event that ends it. */
  const begin = (event: PointerEvent | KeyboardEvent, listen: () => () => void): void => {
    const callback = onStart(event);
    active = true;
    end = typeof callback === 'function' ? callback : undefined;
    detachPress = listen();
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (active || event.button !== 0 || !event.isPrimary) return;
    const pointerId = event.pointerId;
    begin(event, () => {
      const onPointerEnd = (end: PointerEvent): void => {
        if (end.pointerId === pointerId) finish();
      };
      view.addEventListener('pointerup', onPointerEnd);
      view.addEventListener('pointercancel', onPointerEnd);
      return () => {
        view.removeEventListener('pointerup', onPointerEnd);
        view.removeEventListener('pointercancel', onPointerEnd);
      };
    });
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (active || event.target !== element || event.repeat) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const key = event.key;
    begin(event, () => {
      const onKeyUp = (release: KeyboardEvent): void => {
        if (release.key === key) finish();
      };
      element.addEventListener('keyup', onKeyUp);
      element.addEventListener('blur', finish);
      return () => {
        element.removeEventListener('keyup', onKeyUp);
        element.removeEventListener('blur', finish);
      };
    });
  };

  element.addEventListener('pointerdown', onPointerDown);
  element.addEventListener('keydown', onKeyDown);

  return () => {
    element.removeEventListener('pointerdown', onPointerDown);
    element.removeEventListener('keydown', onKeyDown);
    active = false;
    end = undefined;
    detachPress?.();
    detachPress = undefined;
  };
}
