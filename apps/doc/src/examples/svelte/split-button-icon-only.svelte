<script lang="ts">
  import type { SplitButtonAction } from '@udixio/core';
  import { iLink } from '@udixio/icons-rounded-400/link';
  import { iMail } from '@udixio/icons-rounded-400/mail';
  import { iManageAccounts } from '@udixio/icons-rounded-400/manage_accounts';
  import { iShare } from '@udixio/icons-rounded-400/share';
  import { SplitButton } from '@udixio/ui-svelte';

  const actions: SplitButtonAction[] = [
    { id: 'copy-link', label: 'Copy project link', icon: iLink },
    { id: 'invite', label: 'Invite a teammate', icon: iMail },
    { id: 'manage', label: 'Manage project access', icon: iManageAccounts },
  ];
  let message = $state('');
</script>

<div class="flex flex-col items-center gap-3">
  <p class="text-body-medium">Project sharing</p>
  <SplitButton
    icon={iShare}
    accessibleLabel="Share"
    menuLabel="More project sharing options"
    {actions}
    variant="tonal"
    size="medium"
    onPrimaryAction={() => (message = 'Share action requested')}
    onActionSelect={(action) => (message = `${action.label} selected`)}
  />
  <p class="text-body-medium" aria-live="polite">
    {message || 'Open the sharing dialog or choose a related action.'}
  </p>
</div>
