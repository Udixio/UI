/**
 * The "Draw attention" scene (`emphasis.ts`) as Udixio UI components: a code field and its Check button in a card. The
 * scene owns the state (`sceneState.ts`) and these render from it. The motions stay on neutral wrappers, which isolates
 * them from the components: the field's wrapper shakes when the code is refused, the button's wrapper presses on each
 * check, and the badge counts the refusals and pops at each one — each replays when its `data-state` changes.
 */
import { Button, Card, TextField } from '@udixio/ui-react';
import { useSceneState } from './useSceneState';

export type EmphasisState = {
  /** Every Check. */
  presses: number;
  /** Every refused code. */
  refusals: number;
  /** The last code checked was the right one. */
  accepted: boolean;
  /** The scene has defined the badge's custom emphasis: the badge can name it. */
  ready: boolean;
};

/** Digits only, four at most. */
const fourDigits = (raw: string) => raw.replace(/\D/g, '').slice(0, 4);

export function EmphasisForm() {
  const [ref, state] = useSceneState<EmphasisState, HTMLFormElement>({
    presses: 0,
    refusals: 0,
    accepted: false,
    ready: false,
  });
  const refused = !state.accepted && state.refusals > 0;
  const message = state.accepted
    ? 'Code accepted.'
    : state.refusals === 0
      ? ''
      : state.refusals === 1
        ? 'Not this code.'
        : `Not this code: ${state.refusals} refusals.`;

  return (
    <Card variant="filled" className="w-full max-w-[19rem] p-5">
      {/* Enter in the field submits the form, as the Check button does; the scene listens to the submit. */}
      <form ref={ref} className="flex flex-col gap-4" data-emphasis-form onSubmit={(event) => event.preventDefault()}>
        <div data-motion="shake" data-state={state.refusals}>
          <TextField
            label="Code"
            variant="outlined"
            autoComplete="off"
            mask={fourDigits}
            supportingText={state.accepted ? message : 'Four digits'}
            errorText={refused ? message : undefined}
            data-emphasis-field
          />
        </div>
        <span className="relative self-start" data-motion="press" data-state={state.presses}>
          <Button type="submit" size="small" label="Check" />
          <span
            className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-error px-1 text-label-small text-on-error data-[state=0]:invisible"
            aria-hidden="true"
            data-motion={state.ready ? 'badge-pop' : undefined}
            data-state={state.refusals}
          >
            {state.refusals}
          </span>
        </span>
        <p className="sr-only" role="status">
          {message}
        </p>
      </form>
    </Card>
  );
}
