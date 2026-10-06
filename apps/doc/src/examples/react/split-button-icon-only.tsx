import { useState } from 'react';
import { iLink } from '@udixio/icons-rounded-400/link';
import { iMail } from '@udixio/icons-rounded-400/mail';
import { iManageAccounts } from '@udixio/icons-rounded-400/manage_accounts';
import { iShare } from '@udixio/icons-rounded-400/share';
import { SplitButton, type SplitButtonAction } from '@udixio/ui-react';

const actions: SplitButtonAction[] = [
  { id: 'copy-link', label: 'Copy project link', icon: iLink },
  { id: 'invite', label: 'Invite a teammate', icon: iMail },
  { id: 'manage', label: 'Manage project access', icon: iManageAccounts },
];

export default function SplitButtonIconOnlyReact() {
  const [message, setMessage] = useState('');

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-body-medium">Project sharing</p>
      <SplitButton
        icon={iShare}
        accessibleLabel="Share"
        menuLabel="More project sharing options"
        actions={actions}
        variant="tonal"
        size="medium"
        onPrimaryAction={() => setMessage('Share action requested')}
        onActionSelect={(action) => setMessage(`${action.label} selected`)}
      />
      <p className="text-body-medium" aria-live="polite">
        {message || 'Open the sharing dialog or choose a related action.'}
      </p>
    </div>
  );
}
