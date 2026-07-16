import { ActionOrLink } from '../utils';

type ButtonVariant = 'filled' | 'elevated' | 'tonal' | 'outlined' | 'text';
type ButtonVariantAlias = 'primary' | 'secondary';

export interface ButtonProps {
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

  loading?: boolean;

  /**
   * The shape of the button defines whether it is squared or rounded.
   */
  shape?: 'squared' | 'rounded';

  allowShapeTransformation?: boolean;

  onToggle?: (isActive: boolean) => void;
  activated?: boolean;
  label?: string;
}

type Elements = ['button', 'touchTarget', 'stateLayer', 'icon', 'label'];

export type ButtonInterface = ActionOrLink<ButtonProps> & {
  elements: Elements;
  states: {
    isActive: boolean;
  };
};
