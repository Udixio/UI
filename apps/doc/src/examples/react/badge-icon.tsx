import { Badge, Icon } from '@udixio/ui-react';
import { iInbox } from '@udixio/icons-rounded-400/inbox';
import { iNotifications } from '@udixio/icons-rounded-400/notifications';

export const BadgeIconReact = () => (
  <div className="flex flex-wrap items-center gap-10 p-8">
    <Badge description="Unread messages">
      <Icon icon={iInbox} />
    </Badge>

    <Badge label={3} description="3 unread messages">
      <Icon icon={iInbox} />
    </Badge>

    <Badge label={1000} max={999} description="999 or more notifications">
      <Icon icon={iNotifications} />
    </Badge>
  </div>
);
