import {
  type DividerInterface,
  dividerStyle,
  type ReactProps,
} from '@udixio/core';
import { createUseStyle } from '../utils/create-use-style';

export type ReactDividerProps = ReactProps<DividerInterface>;

export const useDividerStyle = createUseStyle(dividerStyle);

/**
 * Dividers are thin lines that group content in lists or other containers
 * @status beta
 * @category Layout
 * @devx
 * - Renders a semantic `<hr>`; use `orientation` for vertical dividers.
 * @a11y
 * - Renders a native `<hr>`, exposing the implicit `separator` role without extra ARIA.
 * - Sets `aria-orientation="vertical"` when `orientation="vertical"`, since the implicit default for `separator` is horizontal.
 * @limitations
 * - Purely decorative; there is no `decorative`/`aria-hidden` escape hatch, so every divider is announced as a separator to assistive technology.
 */
export const Divider = ({
  orientation = 'horizontal',
  className,
  ...restProps
}: ReactDividerProps) => {
  const styles = useDividerStyle({ orientation, className });

  return (
    <hr
      className={styles.divider}
      aria-orientation={orientation === 'vertical' ? 'vertical' : undefined}
      {...restProps}
    />
  );
};
