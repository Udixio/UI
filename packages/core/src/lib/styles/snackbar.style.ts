import {
  type ClassNameComponent,
  cx,
  defaultClassNames,
} from '../utils';
import { SnackbarInterface } from '../interfaces';

const snackbarConfig: ClassNameComponent<SnackbarInterface> = () => ({
  snackbar: cx('rounded bg-inverse-surface overflow-hidden'),
  container: cx(
    'pl-4 pr-2 max-w-full py-1 flex items-center flex-wrap',
  ),
  supportingText: cx('text-body-medium text-inverse-on-surface '),
  icon: cx(' ml-auto mr-0 text-inverse-on-surface block dark'),
});

export const snackbarStyle = defaultClassNames<SnackbarInterface>(
  'snackbar',
  snackbarConfig,
);
