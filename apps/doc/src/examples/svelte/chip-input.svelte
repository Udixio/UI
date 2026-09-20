<script lang="ts">
  import { Chip } from '@udixio/ui-svelte';

  let tags = $state(['Svelte', 'TypeScript', 'Angular']);
</script>

<div class="flex flex-wrap gap-2">
  {#each tags as tag (tag)}
    <Chip label={tag} onRemove={() => (tags = tags.filter((item) => item !== tag))} />
  {/each}
</div>
