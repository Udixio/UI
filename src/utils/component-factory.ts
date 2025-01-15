import React, { HTMLAttributes } from 'react';
import { StyleProps, StylesHelper } from './StylesHelper';

export class ComponentHelper<
  PropsRequired extends object,
  PropsOptional extends object,
  States extends object,
  HTML extends HTMLElement = HTMLDivElement,
> {
  elements: string[];

  private classNameType!: StyleProps<
    PropsOptional & PropsRequired & States,
    (typeof this.elements)[number]
  >;

  private propsType!: PropsRequired &
    Partial<PropsOptional> & {
      ref?: React.RefObject<HTML>;
    } & HTMLAttributes<HTML> &
    typeof this.classNameType;

  private style: (typeof this.classNameType)['className'];

  constructor(args: { elements: string[] }) {
    this.elements = args.elements;
  }

  setDefaultStyle(className: (typeof this.classNameType)['className']) {
    this.style = className;
  }

  getStyles(
    args: PropsRequired & PropsOptional & States & typeof this.classNameType
  ) {
    return StylesHelper.classNamesElements<
      PropsRequired & PropsOptional & States,
      (typeof this.elements)[number]
    >({
      default: this.elements[0],
      classNameList: [args.className, this.style],
      states: args,
    });
  }
}
