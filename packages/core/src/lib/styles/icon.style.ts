import { resolveIconKind } from '../icon';
import type { IconInterface } from '../interfaces/icon.interface';
import { type ClassNameComponent, cx, defaultClassNames } from '../utils';

const iconConfig: ClassNameComponent<IconInterface> = ({ icon }) => ({
  icon: cx(
    'size-5 box-content',
    resolveIconKind(icon) === 'raw' && 'inline-flex fill-current',
  ),
});

export const iconStyle = defaultClassNames<IconInterface>('icon', iconConfig);
