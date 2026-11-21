import { Motion } from '@udixio/ui-react';
import '@udixio/motion/presets';

// The first item has its text directly in the moving element, so a layout move stretches the text with the box.
// The second wraps the text in a span, which keeps its shape: the layout corrects the span, not the text.
export function Steps() {
  return (
    <ul>
      <Motion as="li" name="reflow">
        One
      </Motion>
      <Motion as="li" name="reflow">
        <span>One</span>
      </Motion>
    </ul>
  );
}
