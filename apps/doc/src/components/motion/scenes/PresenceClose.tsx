/**
 * The close button of the card of the "Show and hide" scene (`Presence.astro`): a Udixio IconButton on the card's inverse
 * surface. Its `data-presence-close` hook reaches the scene's click listener.
 */
import { IconButton } from '@udixio/ui-react';
import { iClose } from '@udixio/icons-rounded-400/close';

export function PresenceClose() {
  return (
    <IconButton
      label="Close"
      icon={iClose}
      size="small"
      tooltip={false}
      className="text-inverse-on-surface"
      stateColor="inverse-on-surface"
      data-presence-close
    />
  );
}
