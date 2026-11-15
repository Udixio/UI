type LayoutEngine = typeof import('./layout.js');

let engine: LayoutEngine | undefined;
let loading: Promise<void> | undefined;

/**
 * Load the layout engine, once. A layout motion bound before it is loaded starts following when it is: the
 * engine is a separate chunk, which only a site that binds a layout motion downloads.
 */
export function loadLayoutEngine(): Promise<void> {
  loading ??= import('./layout.js').then(module => {
    engine = module;
  });
  return loading;
}

/** The layout engine, when it is loaded. */
export function layoutEngine(): LayoutEngine | undefined {
  return engine;
}

/** Compare now the scope that follows the neighbours of `element`; nothing to do while no layout motion was ever bound. */
export function flushLayoutAround(element: HTMLElement): void {
  engine?.flushLayoutAround(element);
}
