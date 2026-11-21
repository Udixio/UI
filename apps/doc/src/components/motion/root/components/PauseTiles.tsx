/**
 * The Pause button of the component tiles (WCAG 2.2.2: what moves by itself can be paused). Under reduced motion the
 * tiles are already at rest, and the button gives way to a line that says so.
 */
import { Button } from '@udixio/ui-react';
import { iPause } from '@udixio/icons-rounded-400/pause';
import { iPlayArrow } from '@udixio/icons-rounded-400/play_arrow';
import { setShowcasePaused, useReducedMotion, useShowcasePaused } from './autoplay';

export default function PauseTiles() {
  const paused = useShowcasePaused();
  const reduced = useReducedMotion();

  if (reduced) {
    return <p className="text-label-large text-on-surface-variant">Reduced motion: shown at rest</p>;
  }
  return (
    <Button
      variant="outlined"
      size="small"
      icon={paused ? iPlayArrow : iPause}
      label={paused ? 'Play the demos' : 'Pause the demos'}
      onClick={() => setShowcasePaused(!paused)}
    />
  );
}
