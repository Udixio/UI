import { IconButton, Toolbar } from '@udixio/ui-react';
import { iContentCopy } from '@udixio/icons-rounded-400/content_copy';
import { iDelete } from '@udixio/icons-rounded-400/delete';
import { iMoreVert } from '@udixio/icons-rounded-400/more_vert';
import { iShare } from '@udixio/icons-rounded-400/share';
import { iSettings } from '@udixio/icons-rounded-400/settings';

const actions = [
  { id: 'share', label: 'Share presentation', icon: iShare },
  { id: 'settings', label: 'Presentation settings', icon: iSettings },
  { id: 'copy', label: 'Copy presentation link', icon: iContentCopy },
  { id: 'delete', label: 'Delete presentation', icon: iDelete },
];

export default function ToolbarCustomOverflowReact() {
  return (
    <Toolbar
      variant="floating"
      accessibleLabel="Presentation tools"
      actions={actions}
      maxVisible={1}
      more={{ label: 'More presentation tools' }}
      renderMore={({ label, ariaExpanded, ariaHasPopup, onClick }) => (
        <IconButton
          size="small"
          label={label}
          icon={iMoreVert}
          tooltip={false}
          variant="filled"
          aria-haspopup={ariaHasPopup}
          aria-expanded={ariaExpanded}
          onClick={onClick}
        />
      )}
    />
  );
}
