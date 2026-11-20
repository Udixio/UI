/**
 * The control of the "Getting started" hero (`start.ts`), as a Udixio Button: Show a card, which inserts a card with the
 * slide preset. The scene keeps no state of its own; the button's `data-start-add` hook reaches its click listener.
 */
import { Button } from '@udixio/ui-react';

export function StartControls() {
  return <Button size="small" label="Show a card" data-start-add />;
}
