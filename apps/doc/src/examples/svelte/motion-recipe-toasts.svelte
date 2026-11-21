<script module lang="ts">
  import { defineMotion } from '@udixio/motion';
  import '@udixio/motion/presets';

  // A toast rises into place; a leaving toast is taken out of the flow, so the others close the gap at once.
  defineMotion('toast', {
    verb: 'appear',
    keyframes: [
      { opacity: 0, y: 16, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1 },
    ],
    exit: 'out-of-flow',
  });
</script>

<script lang="ts">
  import { iClose } from '@udixio/icons-rounded-400/close';
  import { Button, IconButton, motion, presence } from '@udixio/ui-svelte';

  const MESSAGES = ['Draft saved', 'Link copied', 'Photo uploaded', 'Invite sent'];
  const LIFETIME = 6000;
  const MAX = 3;

  let toasts = $state<{ id: number; text: string }[]>([]);
  let lastId = 0;
  const timers = new Map<number, ReturnType<typeof setTimeout>>();

  function dismiss(id: number) {
    clearTimeout(timers.get(id));
    timers.delete(id);
    // `presence` keeps the toast until its exit has played, then Svelte removes it.
    toasts = toasts.filter((toast) => toast.id !== id);
  }

  function notify() {
    const id = ++lastId;
    const text = MESSAGES[(id - 1) % MESSAGES.length];
    // Past three, the oldest leaves as the new one enters.
    toasts = [...toasts, { id, text }].slice(-MAX);
    timers.set(id, setTimeout(() => dismiss(id), LIFETIME));
  }

  $effect(() => () => timers.forEach(clearTimeout));
</script>

<div class="flex min-h-54 w-full max-w-80 flex-col items-start gap-4">
  <Button size="small" label="Notify" onclick={notify} />
  <!-- One live region, there from the start: each toast added to it is announced. -->
  <ol aria-live="polite" aria-label="Notifications" class="relative flex w-full flex-col gap-2">
    {#each toasts as toast (toast.id)}
      <li
        {@attach motion('toast reflow')}
        transition:presence
        class="flex items-center justify-between gap-2 rounded-2xl bg-surface-container-highest py-1 pl-4 pr-1"
      >
        <span class="min-w-0 text-body-medium text-on-surface">{toast.text}</span>
        <IconButton size="small" label="Dismiss" icon={iClose} tooltip={false} onclick={() => dismiss(toast.id)} />
      </li>
    {/each}
  </ol>
</div>
