import { ComponentFactory } from '../../utils';

type ExternalProps = {
};
type OptionalProps = {
  variant:
    | 'hero'
    | 'center-aligned hero'
    | 'multi-browse'
    | 'un-contained'
    | 'full-screen';
};
type InternalProps = {
  count: number;
};

type States = InternalProps;
export class CarouselFactory extends ComponentFactory<
  ExternalProps,
  OptionalProps,
  InternalProps,
  States
> {
  defaultProps: OptionalProps & InternalProps = {
    count: 0,
    variant: 'hero',
  };
  protected elements = ['carousel'];
}
