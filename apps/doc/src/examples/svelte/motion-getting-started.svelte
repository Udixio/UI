<script lang="ts">
  import { defineMotion } from '@udixio/motion';
  import {
    Button,
    motion,
    presence,
  } from '@udixio/ui-svelte';

  // Step 2: the motion, defined once by name.
  defineMotion('toast', {
    verb: 'appear',
    keyframes: [
      { opacity: 0, y: 16, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1 },
    ],
  });

  // The toast's look: an M3 snackbar with an action.
  const toastClass = [
    'flex min-h-12 items-center gap-2 rounded',
    'bg-inverse-surface py-0.5 ps-4 pe-2',
    'text-body-medium text-inverse-on-surface',
  ].join(' ');

  let toast = $state(false);

  // The toast leaves by itself after four seconds.
  $effect(() => {
    if (!toast) return;
    const leave = () => (toast = false);
    const timer = setTimeout(leave, 4000);
    return () => clearTimeout(timer);
  });
</script>

<div class="flex flex-col items-center gap-6">
  <Button
    size="small"
    label="Save to library"
    onclick={() => (toast = true)}
  />
  <!-- A live region: the toast is announced. -->
  <div role="status" class="h-12">
    <!-- presence keeps it until its exit ends. -->
    {#if toast}
      <!-- Step 3: attached by its name. -->
      <div
        {@attach motion('toast')}
        transition:presence
        class={toastClass}
      >
        Saved to your library
        <!-- Undo: the toast leaves at once. -->
        <Button
          variant="text"
          size="small"
          label="Undo"
          class="text-inverse-primary"
          stateColor="inverse-primary"
          onclick={() => (toast = false)}
        />
      </div>
    {/if}
  </div>
</div>
