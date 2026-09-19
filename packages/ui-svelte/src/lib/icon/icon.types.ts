import type {
  ClassNameComponent,
  ElementClasses,
  Icon,
  IconInterface,
} from '@udixio/core';

/**
 * Renders a raw SVG string, an `@udixio/icons-*` import, or a Font Awesome icon definition as a decorative, inline icon.
 */
export interface SvelteIconProps {
  icon: Icon;
  colors?: readonly string[];
  /** Classes applied to the root element, merged with the component's own classes. */
  class?: string;
  /** Static or state-aware classes for the component's internal elements, keyed by element name. */
  classes?: ElementClasses<IconInterface> | ClassNameComponent<IconInterface>;
}
