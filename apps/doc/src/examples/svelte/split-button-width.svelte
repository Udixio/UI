<script lang="ts">
  import type { IconButtonWidth, SplitButtonAction } from '@udixio/core';
  import { iDownload } from '@udixio/icons-rounded-400/download';
  import { SplitButton } from '@udixio/ui-svelte';

  const actions: SplitButtonAction[] = [
    { id: 'csv', label: 'Download as CSV' },
    { id: 'excel', label: 'Download as Excel workbook' },
  ];
  const widths: IconButtonWidth[] = ['narrow', 'default', 'wide'];
</script>

<div class="flex flex-wrap items-end justify-center gap-3">
  {#each widths as width (width)}
    <figure class="flex flex-col items-center gap-2">
      <SplitButton
        label="Download report"
        icon={iDownload}
        menuLabel="More report download formats"
        {actions}
        size="medium"
        variant="filled"
        menuButtonProps={{ width }}
      />
      <figcaption class="text-label-small">{width}</figcaption>
    </figure>
  {/each}
</div>
