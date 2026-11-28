/**
 * The "Getting started" link of the root page's hero (`Hero.astro`): a Udixio text Button rendered as a link, its text
 * aligned with the column's edge (`edgeAligned`). A real link, so it works before the island hydrates: its address
 * names React until then, and the stored framework once mounted (framework-urls spec §2.8).
 */
import { Button } from '@udixio/ui-react';
import { iArrowForward } from '@udixio/icons-rounded-400/arrow_forward';
import { useLinkFramework } from '@/lib/framework-choice';
import { withFramework } from '@/lib/framework-url';

export function GettingStartedLink() {
  const framework = useLinkFramework();
  return (
    <Button
      variant="text"
      size="small"
      edgeAligned
      href={withFramework('/motion/getting-started', framework)}
      label="Getting started"
      icon={iArrowForward}
      iconPosition="end"
      className="-mt-1.5 no-underline"
    />
  );
}
