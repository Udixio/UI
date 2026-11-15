/** The inline properties that taking an element out of the flow writes. */
const PINNED = ['position', 'left', 'top', 'width', 'height', 'margin', 'box-sizing'] as const;

/** Take `element` out of the flow where it stands. The returned function puts its inline styles back. */
export function pinOutOfFlow(element: HTMLElement): () => void {
  const { offsetLeft, offsetTop, offsetWidth, offsetHeight, style } = element;
  const saved = PINNED.map(property => ({ property, value: style.getPropertyValue(property), priority: style.getPropertyPriority(property) }));
  style.setProperty('position', 'absolute');
  style.setProperty('left', `${offsetLeft}px`);
  style.setProperty('top', `${offsetTop}px`);
  style.setProperty('width', `${offsetWidth}px`);
  style.setProperty('height', `${offsetHeight}px`);
  style.setProperty('margin', '0');
  style.setProperty('box-sizing', 'border-box');
  let pinned = true;
  return () => {
    if (!pinned) return;
    pinned = false;
    for (const { property, value, priority } of saved) {
      if (value) style.setProperty(property, value, priority);
      else style.removeProperty(property);
    }
  };
}
