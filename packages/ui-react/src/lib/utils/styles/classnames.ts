import { ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

type AdditionalClassGroupIds = 'font';

const twMerge = extendTailwindMerge<AdditionalClassGroupIds>({
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

export const classNames = (...args: ClassValue[]) => {
  return twMerge(clsx(args));
};
export const classnames = (...args: ClassValue[]) => {
  return twMerge(clsx(args));
};
