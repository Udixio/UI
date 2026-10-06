<script lang="ts">
  import type { SplitButtonAction } from '@udixio/core';
  import { iPictureAsPdf } from '@udixio/icons-rounded-400/picture_as_pdf';
  import { SplitButton } from '@udixio/ui-svelte';

  const actions: SplitButtonAction[] = [
    { id: 'csv', label: 'Download as CSV' },
    { id: 'excel', label: 'Download as Excel workbook' },
  ];
  let message = $state('Choose an export format');
  const requestPdf = () => (message = 'PDF export requested');
</script>

<div class="flex flex-col items-center gap-4">
  <div class="flex flex-wrap items-end justify-center gap-5">
    <figure class="flex flex-col items-center gap-2">
      <SplitButton
        label="Download PDF"
        icon={iPictureAsPdf}
        menuLabel="More report export formats"
        {actions}
        variant="filled"
        size="medium"
        onPrimaryAction={requestPdf}
        onActionSelect={(action) => (message = `${action.label} selected`)}
      />
      <figcaption class="text-label-small">Icon and label</figcaption>
    </figure>
    <figure class="flex flex-col items-center gap-2">
      <SplitButton
        label="Download PDF"
        menuLabel="More report export formats"
        {actions}
        variant="filled"
        size="medium"
        onPrimaryAction={requestPdf}
        onActionSelect={(action) => (message = `${action.label} selected`)}
      />
      <figcaption class="text-label-small">Label only</figcaption>
    </figure>
    <figure class="flex flex-col items-center gap-2">
      <SplitButton
        icon={iPictureAsPdf}
        accessibleLabel="Download PDF"
        menuLabel="More report export formats"
        {actions}
        variant="filled"
        size="medium"
        onPrimaryAction={requestPdf}
        onActionSelect={(action) => (message = `${action.label} selected`)}
      />
      <figcaption class="text-label-small">
        Icon only, accessible name “Download PDF”
      </figcaption>
    </figure>
  </div>
  <p class="text-body-medium" aria-live="polite">{message}</p>
</div>
