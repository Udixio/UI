export interface ProgressVisibilityControllerOptions {
  completedPercentage: number;
  transitionDuration: number;
  onVisibilityChange: (isVisible: boolean) => void;
}

/**
 * Shared post-completion hide timing used by every framework adapter: visible
 * as soon as the value is below 100, hidden `transitionDuration` ms after it
 * reaches 100.
 */
export function createProgressVisibilityController({
  completedPercentage,
  transitionDuration,
  onVisibilityChange,
}: ProgressVisibilityControllerOptions): () => void {
  if (completedPercentage < 100) {
    onVisibilityChange(true);
    return () => undefined;
  }

  const timeoutId = setTimeout(() => {
    onVisibilityChange(false);
  }, transitionDuration);

  return () => clearTimeout(timeoutId);
}
