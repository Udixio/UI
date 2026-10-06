<script lang="ts">
  import type { SplitButtonAction } from '@udixio/core';
  import { iDescription } from '@udixio/icons-rounded-400/description';
  import { iLink } from '@udixio/icons-rounded-400/link';
  import { iPictureAsPdf } from '@udixio/icons-rounded-400/picture_as_pdf';
  import { iTableView } from '@udixio/icons-rounded-400/table_view';
  import { SplitButton } from '@udixio/ui-svelte';

  const actions: SplitButtonAction[] = [
    { id: 'csv', label: 'Download as CSV', icon: iTableView },
    { id: 'excel', label: 'Download as Excel workbook', icon: iDescription },
    { id: 'link', label: 'Copy report link', icon: iLink },
  ];
  let message = $state('Choose an export format');
</script>

<div class="flex flex-col items-center gap-4">
  <SplitButton
    label="Download PDF"
    icon={iPictureAsPdf}
    menuLabel="More report export options"
    {actions}
    variant="filled"
    size="medium"
    onPrimaryAction={() => (message = 'PDF export requested')}
    onActionSelect={(action) => (message = `${action.label} selected`)}
  />
  <p class="text-body-medium" aria-live="polite">{message}</p>
</div>
