import type { ClassNameComponent } from '../utils';
import { classNames, defaultClassNames } from '../utils';
import type { StateLayerInterface } from '../interfaces';

const stateLayerConfig: ClassNameComponent<StateLayerInterface> = ({
  stateClassName,
}) => ({
  stateLayer: classNames(
    'absolute left-0 top-0 h-full w-full overflow-hidden pointer-events-none rounded-[inherit]',
    stateClassName,
  ),
});

export const stateLayerStyle = defaultClassNames<StateLayerInterface>(
  'stateLayer',
  stateLayerConfig,
);
