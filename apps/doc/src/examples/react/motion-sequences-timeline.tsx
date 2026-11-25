import { useEffect, useState } from 'react';
import { defineSequence } from '@udixio/motion/sequence';
import { Button, Motion, Slider, useMotionSequence } from '@udixio/ui-react';

// The kicker plays first; the title starts one normal step after it, and the artist one normal step after the title.
defineSequence('timeline-steps', {
  verb: 'appear',
  steps: {
    kicker: { keyframes: [{ opacity: 0 }, { opacity: 1 }] },
    title: {
      keyframes: [{ opacity: 0, y: 12 }, { opacity: 1, y: 0 }],
      timing: { duration: 'duration.extraLong2', easing: 'easing.standard' },
      at: '+=normal',
    },
    body: { keyframes: [{ opacity: 0 }, { opacity: 1 }], at: '+=normal' },
  },
});

export function MotionSequencesTimelineReact() {
  const intro = useMotionSequence<HTMLDivElement>('timeline-steps');
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);

  // While the sequence plays, its time is read on each frame, and the play stops at its end.
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = () => {
      const handle = intro.getHandle();
      const now = handle?.currentTime ?? 0;
      setTime(now);
      if (handle && now >= handle.delay + handle.duration) setPlaying(false);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  // Play resumes a paused sequence, and replays a finished one.
  const toggle = () => {
    if (playing) {
      intro.getHandle()?.pause();
      setPlaying(false);
      return;
    }
    const handle = intro.getHandle();
    if (handle && time < handle.delay + handle.duration) handle.play();
    else intro.play();
    setPlaying(true);
  };

  // The slider seeks the sequence and holds it there, in thousandths of its length.
  const seek = (value: number) => {
    const handle = intro.getHandle() ?? intro.play();
    handle.pause();
    handle.seek((value / 1000) * (handle.delay + handle.duration));
    setPlaying(false);
    setTime(handle.currentTime);
  };

  return (
    <div className="flex w-full max-w-72 flex-col items-start gap-4">
      <div
        ref={intro.ref}
        className="flex w-full flex-col gap-2 rounded-3xl bg-primary-container p-5 text-on-primary-container"
      >
        <Motion as="p" step="kicker" className="text-label-large">
          Now playing
        </Motion>
        <Motion as="h3" step="title" className="text-title-large">
          Night Drive
        </Motion>
        <Motion as="p" step="body" className="text-body-medium">
          Lumen · Side B
        </Motion>
      </div>
      <div className="flex w-full items-center gap-3">
        <Button size="small" label={playing ? 'Pause' : 'Play'} onClick={toggle} />
        <Slider aria-label="Sequence time" min={0} max={1000} step={1} defaultValue={0} onChange={seek} />
      </div>
      <p className="flex items-baseline gap-2 text-body-medium text-on-surface-variant">
        <span className="text-label-large text-on-surface">Sequence time</span>
        <output>{Math.round(time)} ms</output>
      </p>
    </div>
  );
}
