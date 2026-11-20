/**
 * The Close button of the detail of the "Morph one into another" scene (`Gallery.astro`): a Udixio Button, elevated so that it
 * reads on any colour of the detail. Its `data-gallery-close` hook reaches the scene's click listener, and the scene moves
 * the focus to it when the detail opens.
 */
import { Button } from '@udixio/ui-react';

export function GalleryClose() {
  return <Button variant="elevated" size="small" label="Close" data-gallery-close />;
}
