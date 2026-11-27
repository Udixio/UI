<script lang="ts">
  import type { MotionHandle } from '@udixio/motion';
  import {
    defineSequence,
    getSequence,
  } from '@udixio/motion/sequence';
  import {
    Button,
    Slider,
    motionSequence,
  } from '@udixio/ui-svelte';

  // The kicker plays first. The title starts one
  // normal step after it, the artist one after that.
  defineSequence('timeline-steps', {
    verb: 'appear',
    steps: {
      kicker: {
        keyframes: [{ opacity: 0 }, { opacity: 1 }],
      },
      title: {
        keyframes: [
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0 },
        ],
        timing: {
          duration: 'duration.extraLong2',
          easing: 'easing.standard',
        },
        at: '+=normal',
      },
      body: {
        keyframes: [{ opacity: 0 }, { opacity: 1 }],
        at: '+=normal',
      },
    },
  });

  // A play ends after its delay and its duration.
  const endOf = (handle: MotionHandle) =>
    handle.delay + handle.duration;

  let intro: HTMLElement | undefined = $state();
  let playing = $state(false);
  let time = $state(0);

  function binding() {
    return intro ? getSequence(intro) : undefined;
  }

  // While the sequence plays, its time is read on
  // each frame, and the play stops at its end.
  function tick() {
    const handle = binding()?.handle;
    time = handle?.currentTime ?? 0;
    if (handle && time >= endOf(handle)) {
      playing = false;
    }
    if (playing) requestAnimationFrame(tick);
  }

  // Play resumes a paused sequence, and replays a
  // finished one.
  function toggle() {
    const sequence = binding();
    if (!sequence) return;
    if (playing) {
      sequence.handle?.pause();
      playing = false;
      return;
    }
    const handle = sequence.handle;
    if (handle && time < endOf(handle)) {
      handle.play();
    } else {
      sequence.play();
    }
    playing = true;
    requestAnimationFrame(tick);
  }

  // The slider seeks the sequence, in thousandths of
  // its length, and holds it there.
  function seek(value: number) {
    const sequence = binding();
    if (!sequence) return;
    const handle =
      sequence.handle ?? sequence.play();
    handle.pause();
    handle.seek((value / 1000) * endOf(handle));
    playing = false;
    time = handle.currentTime;
  }
</script>

<div
  class="flex w-full max-w-72 flex-col items-start
    gap-4"
>
  <div
    bind:this={intro}
    {@attach motionSequence(
      'timeline-steps',
      () => ({ settled: true }),
    )}
    class="flex w-full flex-col gap-2 rounded-3xl
      bg-primary-container p-5
      text-on-primary-container"
  >
    <p
      data-motion-step="kicker"
      class="text-label-large"
    >
      Now playing
    </p>
    <h3
      data-motion-step="title"
      class="text-title-large"
    >
      Night Drive
    </h3>
    <p
      data-motion-step="body"
      class="text-body-medium"
    >
      Lumen · Side B
    </p>
  </div>
  <div class="flex w-full items-center gap-3">
    <Button
      size="small"
      label={playing ? 'Pause' : 'Play'}
      onclick={toggle}
    />
    <Slider
      aria-label="Sequence time"
      min={0}
      max={1000}
      step={1}
      defaultValue={0}
      onChange={seek}
    />
  </div>
  <p
    class="flex items-baseline gap-2 text-body-medium
      text-on-surface-variant"
  >
    <span class="text-label-large text-on-surface">
      Sequence time
    </span>
    <output>{Math.round(time)} ms</output>
  </p>
</div>
