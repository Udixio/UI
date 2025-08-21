import plugin, { PluginAPI } from 'tailwindcss/plugin';
import {
  font,
  FontPluginOptions,
  state,
  StateOptions,
} from './plugins-tailwind';
import { shadow } from './plugins-tailwind/shadow';

export type ConfigJs = FontPluginOptions & StateOptions;
export type ConfigCss = {
  colorKeys: string[];
  fontStyles: string[];
  responsiveBreakPoints: string[];
};

export const main = plugin.withOptions<ConfigJs>((args) => {
  const configCss = args as unknown as ConfigCss;

  const fontStyles: any = {};

  configCss.fontStyles.forEach((line) => {
    const [styleToken, ...properties] = line.split(' ');
    const [roleToken, sizeToken] = styleToken.split('-');

    fontStyles[roleToken] ??= {};
    properties.forEach((properties) => {
      fontStyles[roleToken][sizeToken] ??= {};
      const [key, value] = properties.slice(0, -1).split('[');
      fontStyles[roleToken][sizeToken][key] = value;
    });
  });

  let breakPointsCss = configCss.responsiveBreakPoints;
  if (!Array.isArray(breakPointsCss)) {
    breakPointsCss = [breakPointsCss];
  }
  const responsiveBreakPoints: any = {};
  breakPointsCss.forEach(([key, value]) => {
    responsiveBreakPoints[key] = value;
  });

  const options: ConfigJs = {
    colorKeys: configCss.colorKeys,
    fontStyles: fontStyles,
    responsiveBreakPoints,
  };

  return (api: PluginAPI) => {
    font(options).handler(api);
    state(options).handler(api);
    shadow.handler(api);
  };
});
