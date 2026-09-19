<script lang="ts">
  import { Button, Checkbox } from '@udixio/ui-svelte';

  let accepted = $state(false);
  let submitted = $state(false);
  const invalid = $derived(submitted && !accepted);

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    submitted = true;
  };
</script>

<form class="flex flex-col items-start gap-3" novalidate onsubmit={submit}>
  <div class="flex items-center gap-3">
    <Checkbox
      id="checkbox-svelte-terms"
      name="terms"
      value="accepted"
      bind:checked={accepted}
      required
      {invalid}
      aria-describedby="checkbox-svelte-terms-description"
    />
    <label for="checkbox-svelte-terms">Accept the terms</label>
  </div>
  <p
    id="checkbox-svelte-terms-description"
    class={invalid ? 'text-error' : 'text-on-surface-variant'}
    aria-live="polite"
  >
    {invalid ? 'You must accept the terms.' : 'Required to continue.'}
  </p>
  <Button type="submit" label="Continue" />
</form>
