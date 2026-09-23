<script lang="ts">
  import { iContentCopy } from '@udixio/icons-rounded-400/content_copy';
  import { iDelete } from '@udixio/icons-rounded-400/delete';
  import { iRedo } from '@udixio/icons-rounded-400/redo';
  import { iSettings } from '@udixio/icons-rounded-400/settings';
  import { iShare } from '@udixio/icons-rounded-400/share';
  import { iUndo } from '@udixio/icons-rounded-400/undo';
  import { Toolbar } from '@udixio/ui-svelte';

  const actions = [
    { id: 'undo', label: 'Undo', icon: iUndo },
    { id: 'redo', label: 'Redo', icon: iRedo },
    { id: 'copy', label: 'Copy formatting', icon: iContentCopy },
    { id: 'share', label: 'Share', icon: iShare },
    { id: 'settings', label: 'Editor settings', icon: iSettings },
    { id: 'delete', label: 'Delete draft', icon: iDelete },
  ];
  const more = { label: 'More editing actions' };
</script>

<Toolbar
  variant="floating"
  accessibleLabel="Editing actions"
  {actions}
  maxVisible={3}
  {more}
/>
