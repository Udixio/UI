import React, { HTMLAttributes } from 'react';
import { StyleProps, StylesHelper } from './StylesHelper';

export type ComponentProps<
  PropsRequired extends object,
  PropsOptional extends object,
  States extends object,
  Elements extends string,
  HTML extends HTMLElement,
> = PropsRequired &
  Partial<PropsOptional> & {
    ref?: React.RefObject<HTML>;
  } & Omit<HTMLAttributes<HTML>, 'className'> &
  ComponentClassName<PropsRequired, PropsOptional, States, Elements>;

export type ComponentClassName<
  PropsRequired extends object,
  PropsOptional extends object,
  States extends object,
  Elements extends string,
> = StyleProps<PropsOptional & PropsRequired & States, Elements>;

export class ComponentHelper<
  TComponentProp extends ComponentProps<
    { ref?: React.RefObject<any> },
    any,
    any,
    any,
    any
  >,
  PropsOptional extends object,
  States extends object,
  Elements extends string,
> {
  private styles: TComponentProp['className'][] = [];

  constructor(private defaultElement: Elements) {}

  addStyle(className: TComponentProp['className']) {
    this.styles.push(className);
  }

  getStyles(args: TComponentProp & States & PropsOptional) {
    return StylesHelper.classNamesElements<
      TComponentProp & States & PropsOptional,
      Elements
    >({
      default: this.defaultElement,
      classNameList: [args.className, ...this.styles],
      states: args,
    });
  }
}
