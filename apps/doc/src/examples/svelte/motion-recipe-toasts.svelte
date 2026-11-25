<script lang="ts">
  import '@udixio/motion/presets';
  import { Button, motion, presence } from '@udixio/ui-svelte';

  const LIFETIME = 4000;
  const MAX = 3;

  let toasts = $state<number[]>([]);
  let lastId = 0;
  const timers = new Map<number, ReturnType<typeof setTimeout>>();

  function dismiss(id: number) {
    clearTimeout(timers.get(id));
    timers.delete(id);
    // `presence` keeps the toast until its exit has played, then Svelte removes it.
    toasts = toasts.filter((toast) => toast !== id);
  }

  function save() {
    const id = ++lastId;
    // Past three, the oldest leaves as the new one enters.
    toasts = [...toasts, id].slice(-MAX);
    timers.set(id, setTimeout(() => dismiss(id), LIFETIME));
  }

  $effect(() => () => timers.forEach(clearTimeout));
</script>

<div class="flex min-h-54 w-full max-w-80 flex-col items-start gap-4">
  <Button size="small" label="Save to library" onclick={save} />
  <!-- One live region, there from the start: each toast added to it is announced. -->
  <ol aria-live="polite" aria-label="Notifications" class="relative flex w-full flex-col gap-2">
    {#each toasts as toast (toast)}
      <li
        {@attach motion('slide reflow')}
        transition:presence
        class="flex min-h-12 items-center gap-2 rounded bg-inverse-surface py-0.5 ps-4 pe-2 text-body-medium text-inverse-on-surface"
      >
        Saved to your library
        <!-- Undo: the toast leaves at once. -->
        <Button
          variant="text"
          size="small"
          label="Undo"
          class="text-inverse-primary"
          stateColor="inverse-primary"
          onclick={() => dismiss(toast)}
        />
      </li>
    {/each}
  </ol>
</div>
