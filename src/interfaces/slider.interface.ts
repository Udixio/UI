export interface SliderInterface {
  type: 'div';
  props: {
    value?: number;

    name: string;
    onChange?: (value: number) => void;
    valueFormatter?: (value: number) => string | number;

    step?: number;
    min?: number;
    max?: number;
    marks?: {
      value: number;
      label?: string;
    }[];
  };
  states: {
    isChanging: boolean;
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
