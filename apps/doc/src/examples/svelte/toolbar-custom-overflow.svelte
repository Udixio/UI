<script lang="ts">
  import { iContentCopy } from '@udixio/icons-rounded-400/content_copy';
  import { iDelete } from '@udixio/icons-rounded-400/delete';
  import { iMoreVert } from '@udixio/icons-rounded-400/more_vert';
  import { iShare } from '@udixio/icons-rounded-400/share';
  import { iSettings } from '@udixio/icons-rounded-400/settings';
  import { IconButton, Toolbar } from '@udixio/ui-svelte';

  const actions = [
    { id: 'share', label: 'Share presentation', icon: iShare },
    { id: 'settings', label: 'Presentation settings', icon: iSettings },
    { id: 'copy', label: 'Copy presentation link', icon: iContentCopy },
    { id: 'delete', label: 'Delete presentation', icon: iDelete },
  ];
  const more = { label: 'More presentation tools' };
</script>

{#snippet customMore({ label, ariaHasPopup, ariaExpanded, toggle })}
  <IconButton
    size="small"
    {label}
    icon={iMoreVert}
    tooltip={false}
    variant="filled"
    aria-haspopup={ariaHasPopup}
    aria-expanded={ariaExpanded}
    onclick={toggle}
  />
{/snippet}

<Toolbar
  variant="floating"
  accessibleLabel="Presentation tools"
  {actions}
  maxVisible={1}
  {more}
  moreTemplate={customMore}
/>
