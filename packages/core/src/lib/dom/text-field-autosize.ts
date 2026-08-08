export interface TextareaAutosizeControllerOptions {
  textarea: HTMLTextAreaElement;
}

export interface TextareaAutosizeController {
  /** Re-measures and resizes; call after a programmatic value change. */
  update(): void;
  destroy(): void;
}

/**
 * Grows a multiline field's `<textarea>` to fit its content, once, for both
 * adapters. Previously implemented only in React via the `react-textarea
 * -autosize` package, which had no Angular counterpart.
 */
export function createTextareaAutosizeController({
  textarea,
}: TextareaAutosizeControllerOptions): TextareaAutosizeController {
  // `height: auto` on a <textarea> falls back to its `rows` attribute, which
  // defaults to 2 when unset -- so a single line of content would measure
  // scrollHeight against an already-two-rows-tall box instead of its real
  // content height. Forcing `rows="1"` makes `auto` fall back to one line,
  // so scrollHeight always reflects actual content from the first render.
  textarea.rows = 1;

  const resize = () => {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  textarea.addEventListener('input', resize);
  resize();

  // scrollHeight of a `display: none` element (or any zero-size ancestor)
  // is always 0, so a controller created while the field is hidden -- for
  // example inside a tab panel that isn't the active one yet -- measures
  // nothing useful no matter how many times or how soon it re-measures.
  // ResizeObserver fires the moment the element actually gets a real box,
  // which is exactly the "became visible" signal needed here. No guard is
  // needed against a feedback loop: resize() is convergent -- once applied,
  // re-measuring finds the same scrollHeight and (re)applies the same
  // height, which is not itself a size change, so the browser stops
  // notifying without another call.
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(textarea);

  return {
    update: resize,
    destroy: () => {
      resizeObserver.disconnect();
      textarea.removeEventListener('input', resize);
    },
  };
}
