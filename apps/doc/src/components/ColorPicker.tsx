import { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import config from '../../theme.config';
import { ThemeProvider } from '@udixio/ui-react';

export const ColorPicker = () => {
  const [color, setColor] = useState<string>('#ffffff');

  return (
    <>
      <HexColorPicker color={color} onChange={setColor} />
      <ThemeProvider config={{ ...config, sourceColor: color }}></ThemeProvider>
    </>
  );
};
