export type CardKeyPhase = 'down' | 'up';

export interface CardKeyEvent {
  key: string;
  phase: CardKeyPhase;
}

export interface CardKeyDecision {
  /** The key event activates the card's action. */
  activate: boolean;
  /** The default browser behavior (page scroll on Space) must be prevented. */
  preventScroll: boolean;
}

/**
 * Keyboard activation contract for an interactive card rendered without a
 * native control: Enter activates on key down, Space activates on key up and
 * suppresses page scroll on key down, matching native button behavior.
 */
export const getCardKeyActivation = ({
  key,
  phase,
}: CardKeyEvent): CardKeyDecision => {
  if (key === 'Enter') {
    return { activate: phase === 'down', preventScroll: false };
  }

  if (key === ' ') {
    return phase === 'down'
      ? { activate: false, preventScroll: true }
      : { activate: true, preventScroll: false };
  }

  return { activate: false, preventScroll: false };
};
