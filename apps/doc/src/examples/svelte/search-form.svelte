<script lang="ts">
  import { Search } from '@udixio/ui-svelte';

  let query = $state('');
  let submitted = $state('');
</script>

<form
  class="flex w-full flex-col items-center gap-3"
  onsubmit={(event) => {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get('email');
    submitted = typeof value === 'string' ? value : '';
  }}
>
  <Search
    id="documentation-email-search"
    label="Search by email"
    name="email"
    bind:query
    onSearch={(value) => (submitted = value)}
    placeholder="name@example.com"
    inputMode="email"
    autoComplete="email"
    maxLength={120}
    required
    spellCheck={false}
  />
  <button type="submit" class="rounded-full bg-primary px-4 py-2 text-label-large text-on-primary">Submit native form</button>
  <p class="text-body-small text-on-surface-variant" role="status">{submitted ? `Submitted: ${submitted}` : 'Nothing submitted'}</p>
</form>
