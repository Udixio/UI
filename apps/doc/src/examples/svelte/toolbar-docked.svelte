<script lang="ts">
  import { iAdd } from '@udixio/icons-rounded-400/add';
  import { iMoreHoriz } from '@udixio/icons-rounded-400/more_horiz';
  import { iRedo } from '@udixio/icons-rounded-400/redo';
  import { iShare } from '@udixio/icons-rounded-400/share';
  import { iUndo } from '@udixio/icons-rounded-400/undo';
  import { Fab, Toolbar } from '@udixio/ui-svelte';

  let lastAction = $state('None');

  const setLastAction = (action: string) => {
    lastAction = action;
  };

  const actions = [
    { id: 'undo', label: 'Undo', icon: iUndo, onClick: () => setLastAction('Undo') },
    { id: 'redo', label: 'Redo', icon: iRedo, onClick: () => setLastAction('Redo') },
    {
      id: 'share',
      label: 'Share document',
      icon: iShare,
      onClick: () => setLastAction('Share document'),
    },
  ];
  const more = { label: 'More document actions', icon: iMoreHoriz };
</script>

<div class="relative flex min-h-80 w-full flex-col overflow-hidden rounded-2xl border border-outline bg-surface-container-low">
  <div class="flex flex-1 flex-col justify-center gap-2 p-6">
    <p class="text-title-medium">Document canvas</p>
    <p class="text-body-medium text-on-surface-variant">
      The docked toolbar stays attached to the bottom of this surface.
    </p>
    <p class="text-body-small text-on-surface-variant" role="status" aria-live="polite">
      Last action: {lastAction}
    </p>
  </div>

  <div class="relative">
    <Fab
      class="absolute -top-8 right-4 z-10"
      label="Create document"
      icon={iAdd}
      onclick={() => setLastAction('Create document')}
    />
    <Toolbar accessibleLabel="Document actions" {actions} maxVisible={2} {more} />
  </div>
</div>
