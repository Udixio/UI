import { useState } from 'react';
import { Button } from '@udixio/ui-react';

export default function ButtonToggleReact() {
  const [pressed, setPressed] = useState(false);

  return (
    <Button
      label={pressed ? 'Notifications enabled' : 'Notifications disabled'}
      toggleable
      pressed={pressed}
      onPressedChange={setPressed}
      variant="tonal"
    />
  );
}
