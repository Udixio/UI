import { useState } from 'react';
import { NavigationRail, NavigationRailItem } from '@udixio/ui-react';
import { iHome } from '@udixio/icons-rounded-400/home';
import { iInbox } from '@udixio/icons-rounded-400/inbox';
import { iChat } from '@udixio/icons-rounded-400/chat';
import { iNotifications } from '@udixio/icons-rounded-400/notifications';

// What each destination has waiting. Material recommends clearing a badge
// once its destination has been viewed, so selecting an item removes it.
const initialUnread = { inbox: 3, chat: true, notifications: 1000 };

export const BadgeBasicReact = () => {
  const [selected, setSelected] = useState<number | null>(0);
  const [unread, setUnread] = useState(initialUnread);

  const view = (index: number) => {
    if (index === 1) setUnread((u) => ({ ...u, inbox: 0 }));
    if (index === 2) setUnread((u) => ({ ...u, chat: false }));
    if (index === 3) setUnread((u) => ({ ...u, notifications: 0 }));
  };

  return (
    <NavigationRail
      className="bg-surface-container-highest h-[420px]"
      selectedItem={selected}
      setSelectedItem={setSelected}
      onItemSelected={({ index }) => view(index)}
    >
      <NavigationRailItem icon={iHome} iconSelected={iHome} label="Home" />
      <NavigationRailItem
        icon={iInbox}
        iconSelected={iInbox}
        label="Inbox"
        badge={
          unread.inbox
            ? { label: unread.inbox, description: `${unread.inbox} unread messages` }
            : undefined
        }
      />
      <NavigationRailItem
        icon={iChat}
        iconSelected={iChat}
        label="Chat"
        badge={unread.chat ? { description: 'New activity' } : undefined}
      />
      <NavigationRailItem
        icon={iNotifications}
        iconSelected={iNotifications}
        label="Alerts"
        badge={
          unread.notifications
            ? {
                label: unread.notifications,
                max: 999,
                description: '999 or more notifications',
              }
            : undefined
        }
      />
    </NavigationRail>
  );
};
