/**
 * The "Getting started" link of the root page's hero (`Hero.astro`): a Udixio text Button rendered as a link, its text
 * aligned with the column's edge (`edgeAligned`). A real link, so it works before the island hydrates.
 */
import { Button } from '@udixio/ui-react';
import { iArrowForward } from '@udixio/icons-rounded-400/arrow_forward';

export function GettingStartedLink() {
  return (
    <Button
      variant="text"
      size="small"
      edgeAligned
      href="/motion/getting-started"
      label="Getting started"
      icon={iArrowForward}
      iconPosition="end"
      className="-mt-1.5 no-underline"
    />
  );
}
