<script lang="ts">
  import type { SplitButtonAction, SplitButtonVariant } from '@udixio/core';
  import { iPictureAsPdf } from '@udixio/icons-rounded-400/picture_as_pdf';
  import { SplitButton } from '@udixio/ui-svelte';

  const actions: SplitButtonAction[] = [
    { id: 'csv', label: 'Download as CSV' },
    { id: 'excel', label: 'Download as Excel workbook' },
  ];
  const variants: SplitButtonVariant[] = [
    'elevated',
    'filled',
    'tonal',
    'outlined',
  ];
</script>

<div class="flex flex-wrap items-end justify-center gap-3">
  {#each variants as variant (variant)}
    <figure class="flex flex-col items-center gap-2">
      <SplitButton
        label="Download PDF"
        icon={iPictureAsPdf}
        menuLabel="More report export formats"
        {actions}
        size="medium"
        {variant}
      />
      <figcaption class="text-label-small">{variant}</figcaption>
    </figure>
  {/each}
</div>
