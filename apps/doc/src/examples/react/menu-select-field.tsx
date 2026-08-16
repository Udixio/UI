import { useState } from 'react';
import { MenuItem, TextField } from '@udixio/ui-react';

export default function MenuSelectFieldReact() {
  const [fruit, setFruit] = useState('apple');

  return (
    <div className="w-full max-w-sm">
      <TextField
        type="select"
        label="Favorite fruit"
        value={fruit}
        onChange={setFruit}
      >
        <MenuItem label="Apple" value="apple" />
        <MenuItem label="Banana" value="banana" />
        <MenuItem label="Orange" value="orange" />
      </TextField>
    </div>
  );
}
