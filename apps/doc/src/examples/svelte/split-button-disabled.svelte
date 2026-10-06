<script lang="ts">
  import type { SplitButtonAction } from '@udixio/core';
  import { iDownload } from '@udixio/icons-rounded-400/download';
  import { SplitButton } from '@udixio/ui-svelte';

  const actions: SplitButtonAction[] = [
    { id: 'csv', label: 'Download as CSV' },
    { id: 'excel', label: 'Download as Excel workbook' },
  ];
</script>

<div class="flex flex-col items-center justify-center gap-3">
  <p class="text-body-medium">Choose a report to enable export.</p>
  <SplitButton
    label="Export report"
    icon={iDownload}
    menuLabel="More report export formats"
    {actions}
    variant="filled"
    size="medium"
    disabled
  />
</div>
