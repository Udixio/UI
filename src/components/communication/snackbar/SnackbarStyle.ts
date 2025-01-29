import { ClassNameComponent, StylesHelper } from '@utils/index';
import { SnackbarElement, SnackbarState } from './Snackbar';

export const SnackbarStyle: ClassNameComponent<
  SnackbarState,
  SnackbarElement
> = ({ supportingText }) => {
  return {
    snackbar: StylesHelper.classNames([' rounded bg-inverse-surface ']),
    container: StylesHelper.classNames([
      'pl-4 pr-2 max-w-full py-1 flex items-center flex-wrap',
    ]),
    supportingText: StylesHelper.classNames([
      'text-body-medium text-inverse-on-surface ',
    ]),
    icon: StylesHelper.classNames([
      ' ml-auto mr-0 text-inverse-on-surface block dark',
    ]),
  };
};
