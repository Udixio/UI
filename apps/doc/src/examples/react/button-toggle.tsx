import { useState } from 'react';
import { Button } from '@udixio/ui-react';

export default function ButtonToggleReact() {
  const [pressed, setPressed] = useState(false);

  return (
    <Button
      label="Notifications"
      toggleable
      pressed={pressed}
      onPressedChange={setPressed}
      variant="tonal"
    />
  );
}
