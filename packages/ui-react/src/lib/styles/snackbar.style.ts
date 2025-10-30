import {
  type ClassNameComponent,
  classNames,
  createUseClassNames,
  defaultClassNames,
} from '../utils';
import { SnackbarInterface } from '../interfaces';

const snackbarConfig: ClassNameComponent<SnackbarInterface> = () => ({
  snackbar: classNames(' rounded bg-inverse-surface '),
  container: classNames(
    'pl-4 pr-2 max-w-full py-1 flex items-center flex-wrap',
  ),
  supportingText: classNames('text-body-medium text-inverse-on-surface '),
  icon: classNames(' ml-auto mr-0 text-inverse-on-surface block dark'),
});

export const snackbarStyle = defaultClassNames<SnackbarInterface>(
  'snackbar',
  snackbarConfig,
);

export const useSnackbarStyle = createUseClassNames<SnackbarInterface>(
  'snackbar',
  snackbarConfig,
);
