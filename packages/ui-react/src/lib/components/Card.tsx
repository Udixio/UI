import type {
  AnchorHTMLAttributes,
  HTMLAttributes,
  KeyboardEvent,
  KeyboardEventHandler,
  ReactNode,
  Ref,
} from 'react';
import {
  cardStyle,
  getCardKeyActivation,
  type CardInterface,
  type CardKeyPhase,
  type CardProps,
  type ComponentClassName,
} from '@udixio/core';
import { createUseStyle } from '../utils/create-use-style';
import { State } from '../effects';

type ReactCardOwnProps = CardProps & {
  /** Custom card content; layout is fully owned by the consumer. */
  children?: ReactNode;
  /** Classes or state-aware element classes applied through the shared style contract. */
  className?: ComponentClassName<CardInterface>['className'];
};

type ReactCardContainerProps = ReactCardOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof ReactCardOwnProps> & {
    href?: undefined;
    /** Ref forwarded to the native div element. */
    ref?: Ref<HTMLDivElement>;
  };

type ReactCardLinkProps = ReactCardOwnProps &
  Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    keyof ReactCardOwnProps | 'href'
  > & {
    /** Navigation destination; switches the native element from div to link. */
    href: string;
    /** Ref forwarded to the native anchor element. */
    ref?: Ref<HTMLAnchorElement>;
  };

export type ReactCardProps = ReactCardContainerProps | ReactCardLinkProps;

export const useCardStyle = createUseStyle(cardStyle);

/**
 * Cards display content and actions about a single subject
 * @status stable
 * @category Layout
 * @devx
 * - `href` renders the card as a native link and always applies the interactive treatment.
 * - `interactive` without `href` renders `role="button"` with `tabIndex={0}` and Enter/Space activation; provide the action with `onClick`.
 * @a11y
 * - Actionable cards are focusable, expose native link or button semantics, and show a visible focus outline.
 * - The accessible name of an actionable card comes from its content; keep meaningful text inside it.
 * @limitations
 * - No built-in header/actions slots; layout is fully custom via children.
 * - An actionable card is one action target: do not nest interactive elements inside it; compose inner controls in a non-interactive card instead.
 */
export const Card = (props: ReactCardProps) => {
  const { variant = 'outlined', interactive = false, className } = props;
  const isActionable = interactive || props.href !== undefined;

  const styles = useCardStyle({
    variant,
    interactive: isActionable,
    className,
  });

  const stateLayer = isActionable ? (
    <State
      className={styles.stateLayer}
      colorName={'on-surface'}
      stateClassName={'state-ripple-group-[card]'}
    />
  ) : null;

  if (props.href !== undefined) {
    const {
      variant: _variant,
      interactive: _interactive,
      className: _className,
      children,
      href,
      ref,
      ...nativeProps
    } = props;
    void { _variant, _interactive, _className };

    return (
      <a ref={ref} {...nativeProps} href={href} className={styles.card}>
        {stateLayer}
        {children}
      </a>
    );
  }

  const {
    variant: _variant,
    interactive: _interactive,
    className: _className,
    children,
    href: _href,
    ref,
    role,
    tabIndex,
    onKeyDown,
    onKeyUp,
    ...nativeProps
  } = props;
  void { _variant, _interactive, _className, _href };

  const handleKey = (
    event: KeyboardEvent<HTMLDivElement>,
    phase: CardKeyPhase,
    consumerHandler: KeyboardEventHandler<HTMLDivElement> | undefined,
  ) => {
    consumerHandler?.(event);
    if (event.defaultPrevented) {
      return;
    }

    const decision = getCardKeyActivation({ key: event.key, phase });
    if (decision.preventScroll) {
      event.preventDefault();
    }
    if (decision.activate) {
      event.currentTarget.click();
    }
  };

  const activationProps = interactive
    ? {
        role: role ?? 'button',
        tabIndex: tabIndex ?? 0,
        onKeyDown: (event: KeyboardEvent<HTMLDivElement>) =>
          handleKey(event, 'down', onKeyDown),
        onKeyUp: (event: KeyboardEvent<HTMLDivElement>) =>
          handleKey(event, 'up', onKeyUp),
      }
    : { role, tabIndex, onKeyDown, onKeyUp };

  return (
    <div
      ref={ref}
      {...nativeProps}
      {...activationProps}
      className={styles.card}
    >
      {stateLayer}
      {children}
    </div>
  );
};
