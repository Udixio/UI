import { useState } from 'react';
import { Checkbox } from '@udixio/ui-react';

type Channel = 'email' | 'sms';

export default function CheckboxMixedSelectionReact() {
  const [channels, setChannels] = useState<Record<Channel, boolean>>({
    email: true,
    sms: false,
  });
  const values = Object.values(channels);
  const allChecked = values.every(Boolean);
  const someChecked = values.some(Boolean);

  const setAll = (checked: boolean) => {
    setChannels({ email: checked, sms: checked });
  };

  const setChannel = (channel: Channel, checked: boolean) => {
    setChannels((current) => ({ ...current, [channel]: checked }));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Checkbox
          id="checkbox-react-notifications"
          checked={allChecked}
          indeterminate={someChecked && !allChecked}
          onCheckedChange={setAll}
        />
        <label htmlFor="checkbox-react-notifications">Notifications</label>
      </div>
      <div className="ml-6 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Checkbox
            id="checkbox-react-email"
            checked={channels.email}
            onCheckedChange={(checked) => setChannel('email', checked)}
          />
          <label htmlFor="checkbox-react-email">Email</label>
        </div>
        <div className="flex items-center gap-3">
          <Checkbox
            id="checkbox-react-sms"
            checked={channels.sms}
            onCheckedChange={(checked) => setChannel('sms', checked)}
          />
          <label htmlFor="checkbox-react-sms">SMS</label>
        </div>
      </div>
    </div>
  );
}
