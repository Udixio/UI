/**
 * Move focus to an element without scrolling. An element that cannot take focus gets `tabindex="-1"` for the move only: it
 * goes back when focus leaves the element, or at once when focus did not land on it. A presence exit's `restoreFocus` and a
 * swipe's fly-out move focus with it.
 * @param to - The element focus moves to: an HTML or SVG element; anything else is left alone.
 */
export function moveFocusTo(to: Element): void {
  if (!(to instanceof HTMLElement || to instanceof SVGElement)) return;
  to.focus({ preventScroll: true });
  if (to.matches(':focus') || to.hasAttribute('tabindex')) return;
  to.setAttribute('tabindex', '-1');
  to.focus({ preventScroll: true });
  if (to.matches(':focus')) to.addEventListener('blur', () => to.removeAttribute('tabindex'), { once: true });
  else to.removeAttribute('tabindex');
}
