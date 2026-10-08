import { loader, Variants } from '@udixio/theme';
import { describe, expect, it } from 'vitest';
import { UDIXIO_THEME_PROVIDER_REFERENCE } from './fixtures/udixio-theme-provider-reference';

const referenceCases = Object.entries(
  UDIXIO_THEME_PROVIDER_REFERENCE.cases,
) as Array<
  [
    string,
    (typeof UDIXIO_THEME_PROVIDER_REFERENCE.cases)[keyof typeof UDIXIO_THEME_PROVIDER_REFERENCE.cases],
  ]
>;

describe('ThemeProvider Udixio reference', () => {
  it.each(referenceCases)(
    'matches the live @udixio/theme output for %s',
    async (_name, referenceCase) => {
      const api = await loader(
        {
          sourceColor: referenceCase.sourceColor,
          isDark: referenceCase.isDark,
          contrastLevel: UDIXIO_THEME_PROVIDER_REFERENCE.contrastLevel,
          variant: Variants.Udixio,
        },
        false,
      );
      const colors = Object.fromEntries(
        [...api.colors.getAll()].map(([name, color]) => [name, color.hex]),
      );

      expect(colors).toEqual(referenceCase.colors);
    },
  );
});
