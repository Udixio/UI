import React, { HTMLAttributes } from 'react';
import { StyleProps, StylesHelper } from './StylesHelper';
import { HTMLMotionProps } from 'framer-motion';

interface HTMLElements {
  a: HTMLAnchorElement;
  abbr: HTMLElement;
  address: HTMLElement;
  area: HTMLAreaElement;
  article: HTMLElement;
  aside: HTMLElement;
  audio: HTMLAudioElement;
  b: HTMLElement;
  base: HTMLBaseElement;
  bdi: HTMLElement;
  bdo: HTMLElement;
  big: HTMLElement;
  blockquote: HTMLQuoteElement;
  body: HTMLBodyElement;
  br: HTMLBRElement;
  button: HTMLButtonElement;
  canvas: HTMLCanvasElement;
  caption: HTMLElement;
  center: HTMLElement;
  cite: HTMLElement;
  code: HTMLElement;
  col: HTMLTableColElement;
  colgroup: HTMLTableColElement;
  data: HTMLDataElement;
  datalist: HTMLDataListElement;
  dd: HTMLElement;
  del: HTMLModElement;
  details: HTMLDetailsElement;
  dfn: HTMLElement;
  dialog: HTMLDialogElement;
  div: HTMLDivElement;
  dl: HTMLDListElement;
  dt: HTMLElement;
  em: HTMLElement;
  embed: HTMLEmbedElement;
  fieldset: HTMLFieldSetElement;
  figcaption: HTMLElement;
  figure: HTMLElement;
  footer: HTMLElement;
  form: HTMLFormElement;
  h1: HTMLHeadingElement;
  h2: HTMLHeadingElement;
  h3: HTMLHeadingElement;
  h4: HTMLHeadingElement;
  h5: HTMLHeadingElement;
  h6: HTMLHeadingElement;
  head: HTMLHeadElement;
  header: HTMLElement;
  hgroup: HTMLElement;
  hr: HTMLHRElement;
  html: HTMLHtmlElement;
  i: HTMLElement;
  iframe: HTMLIFrameElement;
  img: HTMLImageElement;
  input: HTMLInputElement;
  ins: HTMLModElement;
  kbd: HTMLElement;
  keygen: HTMLElement;
  label: HTMLLabelElement;
  legend: HTMLLegendElement;
  li: HTMLLIElement;
  link: HTMLLinkElement;
  main: HTMLElement;
  map: HTMLMapElement;
  mark: HTMLElement;
  menu: HTMLElement;
  menuitem: HTMLElement;
  meta: HTMLMetaElement;
  meter: HTMLMeterElement;
  nav: HTMLElement;
  noindex: HTMLElement;
  noscript: HTMLElement;
  object: HTMLObjectElement;
  ol: HTMLOListElement;
  optgroup: HTMLOptGroupElement;
  option: HTMLOptionElement;
  output: HTMLOutputElement;
  p: HTMLParagraphElement;
  param: HTMLParamElement;
  picture: HTMLElement;
  pre: HTMLPreElement;
  progress: HTMLProgressElement;
  q: HTMLQuoteElement;
  rp: HTMLElement;
  rt: HTMLElement;
  ruby: HTMLElement;
  s: HTMLElement;
  samp: HTMLElement;
  search: HTMLElement;
  slot: HTMLSlotElement;
  script: HTMLScriptElement;
  section: HTMLElement;
  select: HTMLSelectElement;
  small: HTMLElement;
  source: HTMLSourceElement;
  span: HTMLSpanElement;
  strong: HTMLElement;
  style: HTMLStyleElement;
  sub: HTMLElement;
  summary: HTMLElement;
  sup: HTMLElement;
  table: HTMLTableElement;
  template: HTMLTemplateElement;
  tbody: HTMLTableSectionElement;
  td: HTMLTableDataCellElement;
  textarea: HTMLTextAreaElement;
  tfoot: HTMLTableSectionElement;
  th: HTMLTableHeaderCellElement;
  thead: HTMLTableSectionElement;
  time: HTMLTimeElement;
  title: HTMLTitleElement;
  tr: HTMLTableRowElement;
  track: HTMLTrackElement;
  u: HTMLElement;
  ul: HTMLUListElement;
  var: HTMLElement;
  video: HTMLVideoElement;
  wbr: HTMLElement;
  webview: HTMLWebViewElement;
}

export type ComponentProps<
  PropsRequired extends object,
  PropsOptional extends object,
  States extends object,
  Elements extends string,
  HTML extends keyof HTMLElements,
> = PropsRequired &
  Partial<PropsOptional> & {
    ref?: React.RefObject<HTMLElements[HTML] | null>;
  } & Omit<HTMLAttributes<HTMLElements[HTML]>, 'className'> &
  ComponentClassName<PropsRequired, PropsOptional, States, Elements>;

export type MotionComponentProps<
  PropsRequired extends object,
  PropsOptional extends object,
  States extends object,
  Elements extends string,
  HTML extends keyof HTMLElements,
> = ComponentProps<PropsRequired, PropsOptional, States, Elements, HTML> &
  Omit<HTMLMotionProps<HTML>, 'ref' | 'className'>;

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
