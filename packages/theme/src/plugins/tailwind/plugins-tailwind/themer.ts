import { AppService } from '../../../app.service';

type SubTheme = {
  name: string;
  selectors?: string[];
  mediaQuery?: '@media (prefers-color-scheme: dark)';
  extend: {
    colors: Record<string, string>;
  };
};

function createSubTheme({
  name,
  darkMode,
  isDarkTheme,
  colors,
}: {
  name: string;
  isDarkTheme: boolean;
  darkMode: 'class' | 'media';
  colors: Record<string, string>;
}): SubTheme {
  const theme: SubTheme = {
    name: isDarkTheme ? name + 'Dark' : name,
    selectors:
      isDarkTheme && darkMode === 'class'
        ? [
            '.dark-mode .theme-' + name,
            '.dark-mode.theme-' + name,
            '[data-theme="dark"] .theme-' + name,
            '[data-theme="dark"].theme-' + name,
          ]
        : [
            '.theme-' + name,
            `.theme-${name} .light-mode`,
            `.theme-${name} [data-theme="light"]`,
            `.light-mode .theme-${name}`,
            `.light-mode.theme-${name}`,
            `[data-theme="light"] .theme-${name}`,
            `[data-theme="light"].theme-${name}`,
          ],
    mediaQuery:
      isDarkTheme && darkMode === 'media'
        ? '@media (prefers-color-scheme: dark)'
        : undefined,
    extend: {
      colors: colors,
    },
  };
  return theme;
}

export const themer = (args: {
  colors: Record<
    string,
    {
      light: string;
      dark: string;
    }
  >;
  darkMode: 'class' | 'media';
  subThemes?: Record<string, string>;
  appService: AppService;
}) => {
  const { themeService, colorService } = args.appService;
  const options: {
    defaultTheme: {
      extend: {
        colors: Record<string, string>;
      };
    };
    themes: [
      {
        name: string;
        selectors?: ['.dark-mode', '[data-theme="dark"]'];
        mediaQuery?: '@media (prefers-color-scheme: dark)';
        extend: {
          colors: Record<string, string>;
        };
      },
      ...SubTheme[]
    ];
  } = {
    defaultTheme: {
      extend: {
        colors: {},
      },
    },
    themes: [
      {
        name: 'darkTheme',
        extend: {
          colors: {},
        },
      },
    ],
  };

  Object.entries(args.colors).forEach(([key, value]) => {
    options.defaultTheme.extend.colors[key] = value.light;
    options.themes[0].extend.colors[key] = value.dark;
  });
  options.themes[0].selectors =
    args.darkMode === 'class'
      ? ['.dark-mode', '[data-theme="dark"]']
      : undefined;
  options.themes[0].mediaQuery =
    args.darkMode === 'media'
      ? '@media (prefers-color-scheme: dark)'
      : undefined;

  if (args.subThemes) {
    Object.entries(args.subThemes).forEach(([key, value]) => {
      themeService.update({ sourceColorHex: value });
      for (const isDarkTheme of [true, false]) {
        const colors: Record<string, string> = {};
        themeService.update({ isDark: isDarkTheme });
        for (const [key, value] of colorService.getColors().entries()) {
          const newKey = key
            .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
            .toLowerCase();
          colors[newKey] = value.getHex();
        }
        options.themes.push(
          createSubTheme({
            name: key,
            isDarkTheme: isDarkTheme,
            darkMode: args.darkMode,
            colors: colors,
          })
        );
      }
    });
  }

  return require('tailwindcss-themer')(options);
};
