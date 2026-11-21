<script lang="ts">
  import '@udixio/motion/presets';
  import { Button, motion, presence } from '@udixio/ui-svelte';

  let open = $state(false);
  let root: HTMLElement;
  const id = $props.id();

  // The exit starts with focus inside: it goes back to the button that opened the dialog.
  const opener = () => root.querySelector<HTMLElement>('[data-dialog-opener]');

  // On open, focus goes to the safe choice of the dialog: its first button, Cancel.
  const focusCancel = (dialog: HTMLElement) => {
    dialog.querySelector('button')?.focus();
  };
</script>

<!-- In a page, the layer is fixed and inert goes on the rest of the page. -->
<div bind:this={root} class="relative w-full max-w-96">
  <div inert={open} class="flex min-h-64 flex-col items-start gap-3 rounded-3xl bg-surface-container p-5">
    <p class="text-label-large text-on-surface-variant">Drafts</p>
    <h3 class="text-title-medium text-on-surface">Spring launch notes</h3>
    <p class="text-body-medium text-on-surface-variant">Edited two hours ago</p>
    <Button data-dialog-opener size="small" variant="tonal" label="Delete draft" onclick={() => (open = true)} />
  </div>
  <!-- presence keeps each element until its exit has played. -->
  {#if open}
    <div
      {@attach motion('fade')}
      transition:presence
      class="absolute inset-0 rounded-3xl bg-black/32"
      onclick={() => (open = false)}
      aria-hidden="true"
    ></div>
    <div
      {@attach motion('scale', () => ({ restoreFocus: opener }))}
      {@attach focusCancel}
      transition:presence
      role="dialog"
      aria-modal="true"
      aria-labelledby="{id}-title"
      aria-describedby="{id}-text"
      tabindex="-1"
      onkeydown={(event) => event.key === 'Escape' && (open = false)}
      class="absolute inset-0 m-auto flex h-fit w-[calc(100%-1rem)] max-w-72 flex-col gap-4 rounded-3xl bg-surface-container-high p-6"
    >
      <h2 id="{id}-title" class="text-title-large text-on-surface">Delete this draft?</h2>
      <p id="{id}-text" class="text-body-medium text-on-surface-variant">
        Spring launch notes will be removed from your drafts.
      </p>
      <div class="flex flex-wrap justify-end gap-2">
        <Button size="small" variant="text" label="Cancel" onclick={() => (open = false)} />
        <Button size="small" variant="text" label="Delete" onclick={() => (open = false)} />
      </div>
    </div>
  {/if}
</div>
