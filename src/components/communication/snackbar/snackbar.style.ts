import { classNames, defaultClassNames } from '@utils/index';
import {
  SnackbarBaseProps,
  SnackbarElements,
  SnackbarStates,
} from '@components/communication/snackbar/snackbar.interface';

export const snackbarStyle = defaultClassNames<
  SnackbarBaseProps & SnackbarStates,
  SnackbarElements
>({
  defaultClassName: ({}) => ({
    snackbar: classNames(' rounded bg-inverse-surface '),
    container: classNames(
      'pl-4 pr-2 max-w-full py-1 flex items-center flex-wrap'
    ),
    supportingText: classNames('text-body-medium text-inverse-on-surface '),
    icon: classNames(' ml-auto mr-0 text-inverse-on-surface block dark'),
  }),
  default: 'snackbar',
});
