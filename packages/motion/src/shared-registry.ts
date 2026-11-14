/**
 * Internal preview registry. Each instance belongs to exactly one document.
 * The future runtime owner must clear it on last release; this module does not
 * install or share a runtime, including across module reloads.
 */
export function createSharedRegistry(document: Document, development: boolean) {
  const entries = new Map<string, Array<{ element: Element | undefined }>>();

  function isLive(element: Element): boolean {
    return element.ownerDocument === document && element.isConnected &&
      element.getAttribute('data-presence') !== 'exiting';
  }

  function duplicate(key: string): never {
    throw new Error(`Multiple live shared elements registered for "${key}"`);
  }

  return {
    register(key: string, element: Element): () => void {
      if (element.ownerDocument !== document) {
        throw new Error('Shared element belongs to a different document');
      }
      const current = entries.get(key);
      if (development && isLive(element) && current?.some(entry => entry.element && entry.element !== element && isLive(entry.element))) {
        duplicate(key);
      }
      const entry: { element: Element | undefined } = { element };
      if (current) current.push(entry);
      else entries.set(key, [entry]);
      let active = true;
      return () => {
        if (!active) return;
        active = false;
        entry.element = undefined;
        const list = entries.get(key);
        if (!list) return;
        const index = list.indexOf(entry);
        if (index !== -1) list.splice(index, 1);
        if (!list.length) entries.delete(key);
      };
    },
    resolve(key: string): Element | undefined {
      let first: Element | undefined;
      for (const { element } of entries.get(key) ?? []) {
        if (!element || !isLive(element)) continue;
        if (!first) first = element;
        else if (development && first !== element) duplicate(key);
        if (!development) break;
      }
      return first;
    },
    clear(): void {
      for (const list of entries.values()) {
        for (const entry of list) entry.element = undefined;
      }
      entries.clear();
    },
  };
}
