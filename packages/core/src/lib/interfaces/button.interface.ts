import { ActionOrLink } from '../utils';
import { Transition } from 'motion';
import { Icon } from '../icon';

type ButtonVariant = 'filled' | 'elevated' | 'tonal' | 'outlined' | 'text';
type ButtonVariantAlias = 'primary' | 'secondary';

/**
 * At least one of `label` or `children` must be provided.
 */
type ButtonContent =
  | { label: string; children?: string }
  | { label?: string; children: string };

type ButtonBaseProps = {
  /**
   * The HTML button type attribute. Only applies when rendered as `<button>`.
   * @default 'button'
   */
  type?: 'button' | 'submit' | 'reset';

  size?: 'xSmall' | 'small' | 'medium' | 'large' | 'xLarge';

  /**
   * The button variant determines the style of the button.
   * Aliases: 'primary' maps to 'filled', 'secondary' maps to 'tonal'
   */
  variant?: ButtonVariant | ButtonVariantAlias;

  /**
   * Disables the button if set to true.
   */
  disabled?: boolean;

  /**
   * Controls whether negative margins are applied to text variant buttons.
   * When true, removes the default negative horizontal margins.
   * Only applies to 'text' variant buttons.
   */
  disableTextMargins?: boolean;

  /**
   * An optional icon to display in the button.
   */
  icon?: Icon;

  iconPosition?: 'left' | 'right';

  loading?: boolean;

  /**
   * The shape of the button defines whether it is squared or rounded.
   */
  shape?: 'squared' | 'rounded';

  allowShapeTransformation?: boolean;

  transition?: Transition;

  onToggle?: (isActive: boolean) => void;
  activated?: boolean;
};

type Props = ButtonContent & ButtonBaseProps;

type Elements = ['button', 'touchTarget', 'stateLayer', 'icon', 'label'];

export type ButtonInterface = ActionOrLink<Props> & {
  elements: Elements;
  states: {
    isActive: boolean;
  };
};
