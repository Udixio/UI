<script lang="ts">
  import { Search } from '@udixio/ui-svelte';
</script>

{#snippet avatar()}
  <span
    class="flex size-[30px] items-center justify-center rounded-full bg-primary text-label-small text-on-primary"
    aria-hidden="true"
  >
    JD
  </span>
{/snippet}

<Search label="Search workspace" placeholder="Search workspace" {avatar} />
