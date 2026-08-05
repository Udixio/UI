export interface SwitchChangeState {
  disabled: boolean;
  isChecked: boolean;
}

export type SwitchChangeTransition =
  | { blocked: true; nextChecked?: never }
  | { blocked: false; nextChecked: boolean };

/** Resolves one switch activation without depending on a framework or DOM event. */
export function getSwitchChangeTransition({
  disabled,
  isChecked,
}: SwitchChangeState): SwitchChangeTransition {
  if (disabled) return { blocked: true };
  return { blocked: false, nextChecked: !isChecked };
}

/**
 * Track/thumb geometry shared by the style layer, both adapters, and the
 * `@udixio/core/dom` Anime.js Layout controller.
 *
 * `handleContainer` is a fixed 28px box (the visible handle's own largest,
 * pressed size) at a fixed `left: 0`; the entire resting offset is
 * expressed as a `translate`, not `left`/`right`. This is not a style
 * preference -- Anime.js's Layout engine only auto-animates
 * `transform`/`translate`-driven position changes; a `left`/`right` swap
 * resolves instantly as plain CSS with nothing left for it to animate.
 *
 * Being a *constant* size regardless of checked/pressed state means this
 * offset no longer depends on the visible handle's own size (16-28px) --
 * unlike the earlier per-size formula this replaces, which put the resting
 * *edge* of a content-sized container at a fixed inset, but left the
 * `group-active/switch:size-7` press-grow (a pure `:active` pseudo-class
 * effect, with no JS state to recompute a per-size offset from) expanding
 * from that same fixed edge instead of from a stable center. The visible
 * handle is centered inside this fixed box instead (see switch.style.ts),
 * so it grows and shrinks from that one fixed point in every state.
 *
 * The resting *center* itself is kept an equal distance from the track's
 * own center in both checked states -- what the original hand-tuned design
 * (a `left`/`right` inset plus a `translate(±50%)` of the handle's own
 * width) produced, and visually more balanced than an equal *edge* gap once
 * the visible handle's own size differs between states.
 */
export const SWITCH_TRACK_WIDTH = 52;
export const SWITCH_TRACK_BORDER_WIDTH = 2;
export const SWITCH_HANDLE_CENTER_OFFSET = 10;
export const SWITCH_HANDLE_CONTAINER_SIZE = 28;

/** Resting `translate` offset (px) of the handle container for the given checked state. */
export function getSwitchHandleOffset(checked: boolean): number {
  const trackCenter = SWITCH_TRACK_WIDTH / 2;
  const center = checked
    ? trackCenter + SWITCH_HANDLE_CENTER_OFFSET
    : trackCenter - SWITCH_HANDLE_CENTER_OFFSET;
  return center - SWITCH_HANDLE_CONTAINER_SIZE / 2 - SWITCH_TRACK_BORDER_WIDTH;
}
