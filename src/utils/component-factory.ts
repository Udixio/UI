import React, { HTMLAttributes, ReactNode } from 'react';

export abstract class ComponentFactory<
  PropsExternal extends object,
  PropsOptional extends object,
  PropsInternal extends object,
  State extends object,
  HTMLElement = HTMLDivElement,
> {
  abstract defaultProps: PropsOptional & PropsInternal;
  protected abstract elements: string[];

  constructor(
    protected callback: (
      props: PropsExternal &
        PropsOptional &
        PropsInternal & {
          ref?: React.RefObject<HTMLElement>;
        } & HTMLAttributes<HTMLElement>
    ) => ReactNode
  ) {}

  render() {
    return (
      args: PropsExternal &
        Partial<PropsOptional> & {
          ref?: React.RefObject<HTMLElement>;
        } & HTMLAttributes<HTMLElement>
    ) => {
      const props: PropsExternal & PropsOptional & PropsInternal = {
        ...this.defaultProps,
        ...args,
      };

      // const test = this.internalStates.map

      return this.callback(props);
    };
  }
}
