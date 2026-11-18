import { useRef } from 'react';
import { scrollTo } from '@udixio/motion/scroll';

// The button scrolls the box to its second section, and gives the focus to the heading there.
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
    <>
      <div ref={box} tabIndex={0} className="h-56 overflow-y-auto">
        <section>Section one</section>
        <section ref={two} tabIndex={-1}>
          Section two
        </section>
      </div>
      <button type="button" onClick={scroll}>
        To section two
      </button>
    </>
  );
}
