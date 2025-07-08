export interface SliderInterface {
  type: 'div';
  props: {
    value: number;
    isChanging: boolean;
    name: string;
    onChange?: (value: number) => void;
    valueFormatter?: (value: number) => string | number;
  };
  states: {};
  defaultProps: {
    step: number;
    min: number;
    max: number;
    marks?: {
      value: number;
      label?: string;
    }[];
  };
  elements: [
    'slider',
    'activeTrack',
    'handle',
    'inactiveTrack',
    'valueIndicator',
    'dot',
  ];
}
