<script lang="ts">
  import type { SplitButtonAction, SplitButtonSize } from '@udixio/core';
  import { iPictureAsPdf } from '@udixio/icons-rounded-400/picture_as_pdf';
  import { SplitButton } from '@udixio/ui-svelte';

  const actions: SplitButtonAction[] = [
    { id: 'csv', label: 'Download as CSV' },
    { id: 'excel', label: 'Download as Excel workbook' },
  ];
  const sizes: SplitButtonSize[] = [
    'xSmall',
    'small',
    'medium',
    'large',
    'xLarge',
  ];
</script>

<div class="flex flex-wrap items-end justify-center gap-3">
  {#each sizes as size (size)}
    <figure class="flex flex-col items-center gap-2">
      <SplitButton
        label="Download PDF"
        icon={iPictureAsPdf}
        menuLabel="More report export formats"
        {actions}
        variant="filled"
        {size}
      />
      <figcaption class="text-label-small">{size}</figcaption>
    </figure>
  {/each}
</div>
