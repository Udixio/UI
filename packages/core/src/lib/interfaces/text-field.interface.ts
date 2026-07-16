export type TextFieldVariant = 'filled' | 'outlined';

type Props = {
  disabled?: boolean;
  errorText?: string | null;
  suffix?: string;
  value?: string;
  variant?: TextFieldVariant;
  multiline?: boolean;
};

export type TextFieldStates = {
  isFocused: boolean;
  showErrorIcon: boolean;
  showSupportingText: boolean;
  leadingIconInteractive?: boolean;
  trailingIconInteractive?: boolean;
};

export interface TextFieldInterface {
  type: 'div';
  props: Props;
  states: TextFieldStates;
  elements: [
    'textField',
    'content',
    'label',
    'input',
    'activeIndicator',
    'supportingText',
    'leadingIcon',
    'trailingIcon',
    'suffix',
    'stateLayer',
  ];
}
