import { useState } from 'react';
import { iLink } from '@udixio/icons-rounded-400/link';
import { iMail } from '@udixio/icons-rounded-400/mail';
import { iManageAccounts } from '@udixio/icons-rounded-400/manage_accounts';
import { iShare } from '@udixio/icons-rounded-400/share';
import { SplitButton, type SplitButtonAction } from '@udixio/ui-react';

const actions: SplitButtonAction[] = [
  { id: 'copy-link', label: 'Copy public link', icon: iLink, disabled: true },
  { id: 'invite', label: 'Invite by email', icon: iMail },
  { id: 'manage', label: 'Manage access', icon: iManageAccounts },
];

export default function SplitButtonDisabledActionReact() {
  const [message, setMessage] = useState('Choose how to share the project');

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-body-medium">
        Public links are disabled by this workspace’s administrator.
      </p>
      <SplitButton
        label="Share project"
        icon={iShare}
        menuLabel="More project sharing options"
        actions={actions}
        variant="filled"
        size="medium"
        onPrimaryAction={() => setMessage('Share dialog requested')}
        onActionSelect={(action) => setMessage(`${action.label} selected`)}
      />
      <p className="text-body-medium" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
