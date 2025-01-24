import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const classNames = (...args: ClassValue[]) => {
  return twMerge(clsx(args));
};
export const classnames = (...args: ClassValue[]) => {
  return twMerge(clsx(args));
};