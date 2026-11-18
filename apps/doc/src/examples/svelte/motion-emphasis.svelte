<script lang="ts">
  import '@udixio/motion/presets';
  import { motion } from '@udixio/ui-svelte';

  let code = $state('');
  let checks = $state(0);
  let refusals = $state(0);
  let invalid = $state(false);

  function submit() {
    checks += 1;
    invalid = code !== '1234';
    if (invalid) refusals += 1;
  }
</script>

<div class="flex flex-col items-start gap-4">
  <input
    {@attach motion('shake', () => ({
      state: refusals,
    }))}
    bind:value={code}
    aria-invalid={invalid}
    onkeydown={(event) => event.key === 'Enter' && submit()}
    class="rounded-xl border border-outline bg-surface-container-lowest px-4 py-2 text-on-surface"
  />
  <button
    type="button"
    {@attach motion('press', () => ({
      state: checks,
    }))}
    onclick={submit}
    class="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
  >
    Check
  </button>
</div>
