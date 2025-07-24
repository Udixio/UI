import { createTheme } from '@udixio/theme';

jest.mock('@udixio/theme', () => ({
  createTheme: jest.fn().mockReturnValue({ mockTheme: true }),
}));

describe('tailwind', () => {
  it('should export the result of createTheme', () => {
    const theme = require('./index');
    expect(createTheme).toHaveBeenCalled();
    expect(theme).toEqual({ mockTheme: true });
  });
});