/**
 * One sentence per option of a motion definition, shown by `MotionOptions`. The names are the option names of the
 * manifest (`verbs[verb].options`); the values and defaults come from the manifest itself, so only the meaning lives here.
 */
export const optionDocs: Record<string, string> = {
  timing:
    'A spring token (spring.*) or a curve, { duration, easing }. Without it, the verb’s own spring applies: spatial for a movement, effects for an opacity.',
  reduced:
    'What the motion shows under reduced motion: fade (a short fade), instant (the end state at once), static (an emphasis applies its end frame), neutral (a scrub stays where it is) or frozen (a loop does not play).',
  interrupt:
    'What an interrupted motion does: carry keeps its velocity and continues from where it is, restart begins again from the first frame.',
  stagger:
    'The step between the elements that enter together: tight (20 ms), normal (50 ms) or loose (100 ms), capped at 400 ms in all.',
  origin:
    'Where the cascade starts: first (the default), last, or center, which spreads both ways from the middle.',
  exit:
    'How a leaving element moves its neighbours: in-place keeps it where it is until its exit ends; out-of-flow takes it out of the flow at once, so they close the gap while it fades. It needs a positioned parent.',
  split:
    'Cuts the text into words, chars or lines, which play in a cascade in reading order.',
  repeat:
    'once (the default) plays a reveal the first time the element enters the view; always plays it on each entry.',
  axis:
    'The direction the motion follows: block (the vertical view or scroll, the default) or inline (the horizontal one).',
  range:
    'The part of the scroll the keyframes span: enter, cross (the default), exit, or contain.',
  pause:
    'control: the page offers a visible control that pauses the loop. essential: the loop is the content itself, and the page offers none.',
  reason:
    'Why an essential loop cannot be paused, in a sentence. Required with pause essential, and refused on a control loop.',
  shared:
    'The key that makes the elements bearing it one thing for the eye, such as a thumbnail and the detail it opens. A layout option.',
};
