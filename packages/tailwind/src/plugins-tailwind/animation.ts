import plugin, { PluginAPI } from 'tailwindcss/plugin';
import { kebabCase } from 'text-case';

export interface AnimationPluginOptions {
  prefix?: string;
}

const createAnimationFunc =
  ({
    addBase,
    prefix,
    matchUtilities,
    addUtilities,
  }: {
    addBase: PluginAPI['addBase'];
    matchUtilities: PluginAPI['matchUtilities'];
    addUtilities: PluginAPI['addUtilities'];
    prefix: string;
  }) =>
  (
    name: string,
    styles: (
      param: (propertyName: string) => string,
    ) => Record<string, Record<string, string>>,
    values: Record<
      string,
      {
        as?: string;
        DEFAULT: string;
        values: Record<string, string>;
      }
    >,
    callback?: (args: {
      variableName: (propertyName: string) => string;
      name: string;
      dependencies: string[];
    }) => void,
  ) => {
    const variableName = (propertyName: string) => {
      return `--${prefix}-${propertyName}`;
    };

    const param = (propertyName: string) => {
      const defaultValue = values[propertyName]?.DEFAULT;
      return `var(${variableName(propertyName)} ${defaultValue ? `, ${defaultValue}` : ''})`;
    };

    const dependencies: string[] = [];

    Object.values(styles(param)).forEach((step) => {
      Object.keys(step).forEach((key) => {
        dependencies.push(kebabCase(key));
      });
    });

    addBase({
      [`@keyframes ${prefix}-${name}`]: styles(param),
    });

    addUtilities({
      [`.${prefix}-${name}, .${prefix}-${name}-in, .${prefix}-${name}-out`]: {
        [`--${prefix}-name-${name}`]: `${prefix}-${name}`,
        [`--${prefix}-dependencies-${name}`]: dependencies.join(', '),
        animationDuration: `var(--${prefix}-durations, 300ms)`,
        animationDelay: `var(--${prefix}-delays, 0)`,
        animationTimingFunction: `var(--${prefix}-eases, cubic-bezier(0.4, 0, 0.2, 1))`,
        animationFillMode: 'both',
      },
      [`.${prefix}-${name}, .${prefix}-${name}-in`]: {
        animationPlayState: `var(--${prefix}-in-state, paused)`,
      },
      [`.${prefix}-${name}-out`]: {
        animationPlayState: `var(--${prefix}-out-state, paused)`,
      },
    });

    addUtilities({
      [`.${prefix}-${name}-scroll`]: {
        [`--${prefix}-name-${name}`]: `${prefix}-${name}`,
        [`--${prefix}-dependencies-${name}`]: dependencies.join(', '),
        animationTimeline: `var(--${prefix}-timeline, view())`,
        animationRangeStart: `var(--${prefix}-range-start, entry 20%)`,
        animationRangeEnd: `var(--${prefix}-range-end, cover 50%)`,
        animationFillMode: 'both',
      },
    });

    Object.entries(values).forEach(([key, value], index) => {
      let as = value.as;
      if (index !== 0 && !value.as) {
        as = key;
      }
      matchUtilities(
        {
          [`${prefix}-${name}${as ? '-' + as : ''}`]: (value) => ({
            [variableName(key)]: value,
          }),
        },
        {
          values: value.values,
        },
      );
    });

    callback?.({ variableName, name, dependencies });
  };
// Animations inspired by temps.js but without overlapping Tailwind's transition utilities
// - prefixed utilities for animation properties: {prefix}-duration-*, {prefix}-delay-*, {prefix}-ease-*, {prefix}-fill-*, {prefix}-direction-*, {prefix}-repeat
// - usage: compose triggers ({prefix}-in|{prefix}-out or {prefix}-view*) + effects (fade/scale/slide/spin) + params
export const animation = plugin.withOptions(
  ({ prefix = 'anim' }: AnimationPluginOptions) => {
    return ({ addBase, matchUtilities, addUtilities }: PluginAPI) => {
      const createAnimation = createAnimationFunc({
        addBase,
        prefix,
        matchUtilities,
        addUtilities,
      });

      addBase({
        '@keyframes enter': {
          from: {
            opacity: `var(--${prefix}-enter-opacity, 1)`,
            transform: `translate3d(var(--${prefix}-enter-translate-x, 0), var(--${prefix}-enter-translate-y, 0), 0) scale3d(var(--${prefix}-enter-scale, 1), var(--${prefix}-enter-scale, 1), var(--${prefix}-enter-scale, 1)) rotate(var(--${prefix}-enter-rotate, 0))`,
          },
        },
        '@keyframes exit': {
          to: {
            opacity: `var(--${prefix}-exit-opacity, 1)`,
            transform: `translate3d(var(--${prefix}-exit-translate-x, 0), var(--${prefix}-exit-translate-y, 0), 0) scale3d(var(--${prefix}-exit-scale, 1), var(--${prefix}-exit-scale, 1), var(--${prefix}-exit-scale, 1)) rotate(var(--${prefix}-exit-rotate, 0))`,
          },
        },
      });

      // Triggers (unifiés): in/out + view*
      addUtilities({
        // in/out
        // run/pause state
        [`.${prefix}-in-run`]: { [`--${prefix}-in-state`]: 'running' },
        [`.${prefix}-in-paused`]: { [`--${prefix}-in-state`]: 'paused' },
        // scroll-driven
        [`.${prefix}-timeline-block`]: {
          animationTimeline: 'view(block)',
        },
        [`.${prefix}-timeline-inline`]: {
          animationTimeline: 'view(inline)',
        },
        // aliases
        [`.${prefix}-timeline-y`]: {
          animationTimeline: 'view(block)',
        },
        [`.${prefix}-timeline-x`]: {
          animationTimeline: 'view(inline)',
        },
      });

      // Data-attribute triggers
      addBase({
        [`[data-${prefix}-in-run]`]: { [`--${prefix}-in-state`]: 'running' },
        [`[data-${prefix}-in-paused]`]: { [`--${prefix}-in-state`]: 'paused' },
      });

      createAnimation(
        'fade',
        (v) => ({
          from: {
            opacity: v('opacity'),
          },
        }),
        {
          opacity: {
            DEFAULT: '0',
            values: {
              0: '0',
              5: '0.05',
              10: '0.1',
              20: '0.2',
              25: '0.25',
              30: '0.3',
              40: '0.4',
              50: '0.5',
              60: '0.6',
              70: '0.7',
              75: '0.75',
              80: '0.8',
              90: '0.9',
              95: '0.95',
              100: '1',
            },
          },
        },
      );

      createAnimation(
        'scale',
        (v) => ({
          from: {
            scale: v('scale'),
          },
        }),
        {
          scale: {
            DEFAULT: '.95',
            values: {
              0: '0',
              50: '.5',
              75: '.75',
              90: '.9',
              95: '.95',
              100: '1',
              105: '1.05',
              110: '1.1',
              125: '1.25',
              150: '1.5',
            },
          },
        },
      );

      // createAnimation(
      //   {
      //     name: 'spin',
      //     addBase,
      //     prefix,
      //     matchUtilities,
      //     addUtilities,
      //   },
      //   (v) => ({
      //     opacity: v('opacity'),
      //   }),
      //   {
      //     to: 'inherit',
      //     from: '6deg',
      //     values: {
      //       1: '1deg',
      //       2: '2deg',
      //       3: '3deg',
      //       6: '6deg',
      //       12: '12deg',
      //       30: '30deg',
      //       45: '45deg',
      //       90: '90deg',
      //       180: '180deg',
      //     },
      //   },
      // );

      const slideValues = {
        DEFAULT: '2rem',
        values: {
          full: '100%',
          0: '0px',
          px: '1px',
          0.5: '0.125rem',
          1: '0.25rem',
          1.5: '0.375rem',
          2: '0.5rem',
          2.5: '0.625rem',
          3: '0.75rem',
          3.5: '0.875rem',
          4: '1rem',
          5: '1.25rem',
          6: '1.5rem',
          7: '1.75rem',
          8: '2rem',
          9: '2.25rem',
          10: '2.5rem',
          11: '2.75rem',
          12: '3rem',
          14: '3.5rem',
          16: '4rem',
          20: '5rem',
          24: '6rem',
          28: '7rem',
          32: '8rem',
          36: '9rem',
          40: '10rem',
          44: '11rem',
          48: '12rem',
          52: '13rem',
          56: '14rem',
          60: '15rem',
          64: '16rem',
          72: '18rem',
          80: '20rem',
          96: '24rem',
        },
      };
      createAnimation(
        'slide',
        (param) => ({
          from: {
            translate: `calc(${param('distance')} * ${param('dx')}) calc(${param('distance')} * ${param('dy')});`,
          },
          to: {
            translate: `var(--tw-translate-x, 0) var(--tw-translate-y, 0)`,
          },
        }),
        {
          distance: {
            ...slideValues,
          },
        },
        ({ name, variableName, dependencies }) => {
          [
            'up',
            'down',
            'left',
            'right',
            'from-top',
            'from-bottom',
            'from-left',
            'from-right',
            'from-top-left',
            'from-top-right',
            'from-bottom-left',
            'from-bottom-right',
            'up-left',
            'up-right',
            'down-left',
            'down-right',
          ].forEach((directionAlias) => {
            let direction:
              | 'from-top'
              | 'from-bottom'
              | 'from-left'
              | 'from-right'
              | 'from-top-left'
              | 'from-top-right'
              | 'from-bottom-left'
              | 'from-bottom-right' = '';

            if (directionAlias.startsWith('from-')) {
              direction = directionAlias;
            } else if (directionAlias === 'up') {
              direction = 'from-bottom';
            } else if (directionAlias === 'down') {
              direction = 'from-top';
            } else if (directionAlias === 'left') {
              direction = 'from-right';
            } else if (directionAlias === 'right') {
              direction = 'from-left';
            } else if (directionAlias === 'up-left') {
              direction = 'from-bottom-right';
            } else if (directionAlias === 'up-right') {
              direction = 'from-bottom-left';
            } else if (directionAlias === 'down-left') {
              direction = 'from-top-right';
            } else if (directionAlias === 'down-right') {
              direction = 'from-top-left';
            }
            if (!direction) {
              throw new Error(`Invalid direction: ${directionAlias}`);
            }

            const dxdy: Record<typeof direction, { dx: string; dy: string }> = {
              'from-top': { dx: '0', dy: '1' },
              'from-bottom': { dx: '0', dy: '-1' },
              'from-left': { dx: '1', dy: '0' },
              'from-right': { dx: '-1', dy: '0' },
              'from-top-left': { dx: '1', dy: '1' },
              'from-top-right': { dx: '-1', dy: '1' },
              'from-bottom-left': { dx: '1', dy: '-1' },
              'from-bottom-right': { dx: '-1', dy: '-1' },
            } as const;
            const { dx, dy } = dxdy[direction];

            addUtilities({
              [`.${prefix}-${name}-${directionAlias}, .${prefix}-${name}-in-${directionAlias}, .${prefix}-${name}-out-${directionAlias}`]:
                {
                  [`--${prefix}-name-${name}-${directionAlias}`]: `${prefix}-${name}`,
                  [`--${prefix}-name-${name}`]: `${prefix}-${name}`,
                  [`--${prefix}-dependencies-${name}`]: dependencies.join(', '),

                  animationDuration: `var(--${prefix}-durations, 300ms)`,
                  animationDelay: `var(--${prefix}-delays, 0)`,
                  animationTimingFunction: `var(--${prefix}-eases, cubic-bezier(0.4, 0, 0.2, 1))`,
                  animationFillMode: 'both',

                  [variableName('dx')]: dx,
                  [variableName('dy')]: dy,
                },
              [`.${prefix}-${name}-${directionAlias}, .${prefix}-${name}-in-${directionAlias}`]:
                {
                  animationPlayState: `var(--${prefix}-in-state, paused)`,
                },
              [`.${prefix}-${name}-out-${directionAlias}`]: {
                animationPlayState: `var(--${prefix}-out-state, paused)`,
              },
            });

            addUtilities({
              [`.${prefix}-${name}-scroll-${directionAlias}`]: {
                [`--${prefix}-name-${name}-${directionAlias}`]: `${prefix}-${name}`,
                [`--${prefix}-name-${name}`]: `${prefix}-${name}`,
                [`--${prefix}-dependencies-${name}`]: dependencies.join(', '),
                animationTimeline: `var(--${prefix}-timeline, view())`,
                animationRangeStart: `var(--${prefix}-range-start, entry 20%)`,
                animationRangeEnd: `var(--${prefix}-range-end, cover 50%)`,
                animationFillMode: 'both',

                [variableName('dx')]: dx,
                [variableName('dy')]: dy,
              },
            });
          });
        },
      );

      // Paramètres (propriétés CSS) sous le même prefix
      matchUtilities(
        {
          [`${prefix}-duration`]: (value) => ({ animationDuration: value }),
        },
        {
          values: {
            75: '75ms',
            100: '100ms',
            150: '150ms',
            200: '200ms',
            300: '300ms',
            500: '500ms',
            700: '700ms',
            1000: '1000ms',
            1500: '1500ms',
            2000: '2000ms',
            3000: '3000ms',
          },
        },
      );

      matchUtilities(
        { [`${prefix}-delay`]: (value) => ({ animationDelay: value }) },
        {
          values: {
            0: '0ms',
            75: '75ms',
            100: '100ms',
            150: '150ms',
            200: '200ms',
            300: '300ms',
            500: '500ms',
            700: '700ms',
            1000: '1000ms',
            1500: '1500ms',
            2000: '2000ms',
            3000: '3000ms',
          },
        },
      );

      matchUtilities(
        { [`${prefix}-ease`]: (value) => ({ animationTimingFunction: value }) },
        {
          values: {
            linear: 'linear',
            in: 'cubic-bezier(0.4, 0, 1, 1)',
            out: 'cubic-bezier(0, 0, 0.2, 1)',
            'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
          },
        },
      );

      matchUtilities(
        { [`${prefix}-fill`]: (value) => ({ animationFillMode: value }) },
        {
          values: {
            none: 'none',
            forwards: 'forwards',
            backwards: 'backwards',
            both: 'both',
          },
        },
      );

      // Scroll-driven params utilities (work with the CSS vars used by -scroll classes)
      // Timeline variable (useful when composing with `*.scroll` animation utilities)
      matchUtilities(
        {
          [`${prefix}-timeline`]: (value) => ({
            [`--${prefix}-timeline`]: value,
          }),
        },
        {
          values: {
            view: 'view()',
            'view-block': 'view(block)',
            'view-inline': 'view(inline)',
          },
        },
      );

      // Range start utilities (presets + arbitrary values via [..])
      matchUtilities(
        {
          [`${prefix}-range-start`]: (value) => ({
            [`--${prefix}-range-start`]: value,
          }),
        },
        {
          values: {
            'entry-0': 'entry 0%',
            'entry-20': 'entry 20%',
            'entry-50': 'entry 50%',
            'entry-80': 'entry 80%',
            'entry-100': 'entry 100%',
            'contain-0': 'contain 0%',
            'cover-0': 'cover 0%',
            'cover-50': 'cover 50%',
            'cover-100': 'cover 100%',
            'exit-0': 'exit 0%',
            'exit-20': 'exit 20%',
            'exit-100': 'exit 100%',
          },
        },
      );

      // Range end utilities (presets + arbitrary values via [..])
      matchUtilities(
        {
          [`${prefix}-range-end`]: (value) => ({
            [`--${prefix}-range-end`]: value,
          }),
        },
        {
          values: {
            'entry-0': 'entry 0%',
            'entry-20': 'entry 20%',
            'entry-50': 'entry 50%',
            'entry-80': 'entry 80%',
            'entry-100': 'entry 100%',
            'contain-0': 'contain 0%',
            'cover-0': 'cover 0%',
            'cover-50': 'cover 50%',
            'cover-100': 'cover 100%',
            'exit-0': 'exit 0%',
            'exit-20': 'exit 20%',
            'exit-100': 'exit 100%',
          },
        },
      );
    };
  },
);
