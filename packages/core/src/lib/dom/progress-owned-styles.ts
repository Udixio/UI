/** Tracks the inline declarations and attributes explicitly written by a progress controller.
 * Cleanup only restores values still equal to the controller's last write.
 */
export function createProgressOwnedStyles() {
  type Snapshot = { value: string | null; priority: string };
  type Entry = {
    element: Element;
    name: string;
    attribute: boolean;
    original: Snapshot;
    last: Snapshot;
  };
  const entries = new Map<Element, Map<string, Entry>>();

  function read(entry: Entry): Snapshot {
    if (entry.attribute) return { value: entry.element.getAttribute(entry.name), priority: '' };
    const style = (entry.element as HTMLElement | SVGElement).style;
    const value = style.getPropertyValue(entry.name);
    return { value: value || null, priority: value ? style.getPropertyPriority(entry.name) : '' };
  }
  function equal(a: Snapshot, b: Snapshot) {
    return a.value === b.value && a.priority === b.priority;
  }
  function write(entry: Entry, snapshot: Snapshot) {
    if (entry.attribute) {
      if (snapshot.value === null) entry.element.removeAttribute(entry.name);
      else entry.element.setAttribute(entry.name, snapshot.value);
    } else {
      const style = (entry.element as HTMLElement | SVGElement).style;
      if (snapshot.value === null) style.removeProperty(entry.name);
      else style.setProperty(entry.name, snapshot.value, snapshot.priority);
    }
  }
  function set(element: Element, name: string, value: string, attribute = false) {
    let declarations = entries.get(element);
    if (!declarations) {
      declarations = new Map();
      entries.set(element, declarations);
    }
    const key = `${attribute ? 'a' : 's'}:${name}`;
    let entry = declarations.get(key);
    if (!entry) {
      entry = { element, name, attribute, original: { value: null, priority: '' }, last: { value: null, priority: '' } };
      entry.original = read(entry);
      declarations.set(key, entry);
    } else {
      const current = read(entry);
      if (!equal(current, entry.last)) entry.original = current;
    }
    write(entry, { value, priority: '' });
    entry.last = read(entry);
  }
  return {
    style: (element: Element, name: string, value: string) => set(element, name, value),
    attribute: (element: Element, name: string, value: string) => set(element, name, value, true),
    restore: () => {
      for (const declarations of entries.values())
        for (const entry of declarations.values())
          if (equal(read(entry), entry.last)) write(entry, entry.original);
      entries.clear();
    },
  };
}

/** Route Motion's object rendering through the controller's tracked writes.
 * A stopped generation ignores renders already queued by Motion's cancel().
 */
export function createProgressMotionTarget<T extends Record<string, string | number>>(
  initial: T,
  isActive: () => boolean,
  render: (key: keyof T, value: T[keyof T]) => void,
): T {
  const values = { ...initial };
  const target = {} as T;
  for (const key of Object.keys(initial) as (keyof T)[]) {
    Object.defineProperty(target, key, {
      enumerable: true,
      get: () => values[key],
      set: (value: T[keyof T]) => {
        values[key] = value;
        if (isActive()) render(key, value);
      },
    });
  }
  return target;
}
