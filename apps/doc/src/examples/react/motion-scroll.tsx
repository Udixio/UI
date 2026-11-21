import { useRef } from 'react';
import { Button } from '@udixio/ui-react';
import { scrollTo } from '@udixio/motion/scroll';

// The button scrolls the box to its second section, and gives the focus to that section.
export function MotionScrollReact() {
  const box = useRef<HTMLDivElement>(null);
  const two = useRef<HTMLElement>(null);
  const scroll = () => {
    scrollTo(two.current!, {
      container: box.current!,
      focus: true,
    });
  };

  return (
    <div className="flex w-full max-w-72 flex-col items-start gap-4">
      <div
        ref={box}
        tabIndex={0}
        className="h-56 w-full overflow-y-auto rounded-3xl bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
      >
        <section className="flex h-56 items-center p-5 text-title-medium text-on-surface">Section one</section>
        <section ref={two} tabIndex={-1} className="flex h-56 items-center p-5 text-title-medium text-on-surface">
          Section two
        </section>
      </div>
      <Button size="small" label="To section two" onClick={scroll} />
    </div>
  );
}
