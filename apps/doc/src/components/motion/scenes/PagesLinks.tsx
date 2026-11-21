/**
 * The two links of the "Change pages" scene (`Pages.astro`, scene `pages.ts`): Udixio Buttons rendered as links, a filled
 * one forward to the next page of the section and a tonal Back. They are real links, so they work before the island
 * hydrates; Back's `data-pages-back` hook reaches the scene, which sends it back in the history.
 */
import { Button } from '@udixio/ui-react';
import { iArrowBack } from '@udixio/icons-rounded-400/arrow_back';
import { iArrowForward } from '@udixio/icons-rounded-400/arrow_forward';

type Props = {
  /** Where the forward link leads, and its label. */
  href: string;
  label: string;
};

export function PagesLinks({ href, label }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="small" href={href} label={label} icon={iArrowForward} iconPosition="end" />
      <Button size="small" variant="tonal" href="/motion" label="Back" icon={iArrowBack} data-pages-back />
    </div>
  );
}
