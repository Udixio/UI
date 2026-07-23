import { ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

type AdditionalClassGroupIds = 'font';

const twMerge = extendTailwindMerge<AdditionalClassGroupIds>({
  // The engine keys its LRU cache on the full input string per element per
  // state combination. With ~30 components × elements × variants the default
  // (500) can thrash, so we size it for the whole design system.
  cacheSize: 2000,
  override: {
    classGroups: {
      'text-color': [
        {
          text: [
            (value: string) =>
              !value.startsWith('display-') &&
              !value.startsWith('headline-') &&
              !value.startsWith('title-') &&
              !value.startsWith('body-') &&
              !value.startsWith('label-'),
          ],
        },
      ],
    },
  },
  extend: {
    classGroups: {
      font: [
        {
          text: [
            (value: string) =>
              value.startsWith('display-') ||
              value.startsWith('headline-') ||
              value.startsWith('title-') ||
              value.startsWith('body-') ||
              value.startsWith('label-'),
          ],
        },
      ],
    },
    conflictingClassGroups: {
      font: ['font'],
    },
  },
});

/**
 * Concatenate class values without Tailwind conflict resolution.
 * Used to build per-element class strings inside `*.style.ts`: those strings
 * are always run through `classNames` again at the `getClassNames` boundary,
 * so a `twMerge` pass here would be redundant work on the hot path.
 */
export const cx = (...args: ClassValue[]) => clsx(args);

/**
 * Concatenate class values and resolve Tailwind conflicts (last wins).
 * Use at the DOM boundary — where user-provided classes must be able to
 * override the component's own utilities.
 */
export const classNames = (...args: ClassValue[]) => twMerge(clsx(args));
