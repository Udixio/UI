/**
 * The buttons 1 to 5 of the "Scroll to a target" scene (`scroll.ts`), as Udixio Buttons: button n scrolls the box to the
 * section `ids[n - 1]`. The scene keeps no state; each button's `data-scroll-go` hook reaches its click listener.
 */
import { Button } from '@udixio/ui-react';

type Props = {
  /** The ids of the sections, in order: button n scrolls the box to the nth one. */
  ids: readonly string[];
};

export function ScrollControls({ ids }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2" role="group" aria-label="Sections">
      {ids.map((id, index) => (
        <Button
          key={id}
          variant="tonal"
          size="xSmall"
          label={String(index + 1)}
          aria-label={`Scroll to section ${index + 1}`}
          data-scroll-go={id}
        />
      ))}
    </div>
  );
}
