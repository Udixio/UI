import { atom } from 'nanostores';

export type ExampleFramework = 'react' | 'angular';

export const EXAMPLE_FRAMEWORK_STORAGE_KEY =
  'udixio:docs:preferred-example-framework';

export const preferredExampleFrameworkStore = atom<ExampleFramework>('react');

let browserPreferenceInitialized = false;

function isExampleFramework(value: unknown): value is ExampleFramework {
  return value === 'react' || value === 'angular';
}

function readStoredPreference(): ExampleFramework | undefined {
  if (typeof window === 'undefined') return undefined;

  try {
    const storedValue = window.localStorage.getItem(
      EXAMPLE_FRAMEWORK_STORAGE_KEY,
    );
    return isExampleFramework(storedValue) ? storedValue : undefined;
  } catch {
    return undefined;
  }
}

export function initializeExampleFrameworkPreference(): void {
  if (typeof window === 'undefined' || browserPreferenceInitialized) return;

  browserPreferenceInitialized = true;

  const storedPreference = readStoredPreference();
  if (storedPreference) {
    preferredExampleFrameworkStore.set(storedPreference);
  }

  window.addEventListener('storage', (event) => {
    if (
      event.key === EXAMPLE_FRAMEWORK_STORAGE_KEY &&
      isExampleFramework(event.newValue)
    ) {
      preferredExampleFrameworkStore.set(event.newValue);
    }
  });
}

export function setPreferredExampleFramework(
  framework: ExampleFramework,
): void {
  preferredExampleFrameworkStore.set(framework);

  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(EXAMPLE_FRAMEWORK_STORAGE_KEY, framework);
  } catch {
    // Storage may be unavailable in privacy-restricted browser contexts.
  }
}

export function resolveExampleFramework(
  preferredFramework: ExampleFramework,
  availableFrameworks: readonly ExampleFramework[],
): ExampleFramework | undefined {
  return availableFrameworks.includes(preferredFramework)
    ? preferredFramework
    : availableFrameworks[0];
}
