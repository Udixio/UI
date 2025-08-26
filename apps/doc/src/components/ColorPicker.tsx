import { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { ThemeProvider } from '@/components/ThemeProvider.tsx';
import config from '../../theme.config';

export const ColorPicker = () => {
  const [color, setColor] = useState<string>('#ffffff');

  return (
    <>
      <HexColorPicker color={color} onChange={setColor} />
      <ThemeProvider config={{ ...config, sourceColor: color }}></ThemeProvider>
    </>
  );
};
