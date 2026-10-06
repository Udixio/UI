<script lang="ts">
  import type { SplitButtonAction } from '@udixio/core';
  import { iLink } from '@udixio/icons-rounded-400/link';
  import { iMail } from '@udixio/icons-rounded-400/mail';
  import { iManageAccounts } from '@udixio/icons-rounded-400/manage_accounts';
  import { iShare } from '@udixio/icons-rounded-400/share';
  import { SplitButton } from '@udixio/ui-svelte';

  const actions: SplitButtonAction[] = [
    { id: 'copy-link', label: 'Copy public link', icon: iLink, disabled: true },
    { id: 'invite', label: 'Invite by email', icon: iMail },
    { id: 'manage', label: 'Manage access', icon: iManageAccounts },
  ];
  let message = $state('Choose how to share the project');
</script>

<div class="flex flex-col items-center gap-3">
  <p class="text-body-medium">
    Public links are disabled by this workspace’s administrator.
  </p>
  <SplitButton
    label="Share project"
    icon={iShare}
    menuLabel="More project sharing options"
    {actions}
    variant="filled"
    size="medium"
    onPrimaryAction={() => (message = 'Share dialog requested')}
    onActionSelect={(action) => (message = `${action.label} selected`)}
  />
  <p class="text-body-medium" aria-live="polite">{message}</p>
</div>
