import plugin, { PluginAPI } from 'tailwindcss/plugin';

export interface AnimationPluginOptions {
  prefix?: string;
}

function filterDefault(values: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(values).filter(([key]) => key !== 'DEFAULT'),
  );
}

// Animations inspired by temps.js but without overlapping Tailwind's transition utilities
// - prefixed utilities for animation properties: anim-duration-*, anim-delay-*, anim-ease-*, anim-fill-*, anim-direction-*, anim-repeat
// - minimal usage: combine .animate-in/.animate-out with effect utilities like .fade-in, .zoom-in, .slide-in-from-right
// - trigger utilities: .udx-run, .udx-paused, .udx-view (scroll-driven)
export const animation = plugin.withOptions(
  ({ prefix = 'udx' }: AnimationPluginOptions) => {
    return ({
      addBase,
      addUtilities,
      matchUtilities,
      theme,
    }: Pick<
      PluginAPI,
      'addBase' | 'addUtilities' | 'matchUtilities' | 'theme'
    >) => {
      // Keyframes definitions using CSS variables (enter/exit)
      addBase({
        '@keyframes enter': {
          from: {
            opacity: 'var(--tw-enter-opacity, 1)',
            transform:
              'translate3d(var(--tw-enter-translate-x, 0), var(--tw-enter-translate-y, 0), 0) scale3d(var(--tw-enter-scale, 1), var(--tw-enter-scale, 1), var(--tw-enter-scale, 1)) rotate(var(--tw-enter-rotate, 0))',
          },
        },
        '@keyframes exit': {
          to: {
            opacity: 'var(--tw-exit-opacity, 1)',
            transform:
              'translate3d(var(--tw-exit-translate-x, 0), var(--tw-exit-translate-y, 0), 0) scale3d(var(--tw-exit-scale, 1), var(--tw-exit-scale, 1), var(--tw-exit-scale, 1)) rotate(var(--tw-exit-rotate, 0))',
          },
        },
      });

      // Base utilities for in/out animations
      addUtilities({
        '.animate-in': {
          animationName: 'enter',
          animationDuration:
            (theme('animationDuration.DEFAULT') as string) || '200ms',
          animationFillMode: 'both',
          animationPlayState: `var(--${prefix}-anim-state, paused)`,
          '--tw-enter-opacity': 'initial',
          '--tw-enter-scale': 'initial',
          '--tw-enter-rotate': 'initial',
          '--tw-enter-translate-x': 'initial',
          '--tw-enter-translate-y': 'initial',
          willChange: 'opacity, transform',
        },
        '.animate-out': {
          animationName: 'exit',
          animationDuration:
            (theme('animationDuration.DEFAULT') as string) || '200ms',
          animationFillMode: 'both',
          animationPlayState: `var(--${prefix}-anim-state, paused)`,
          '--tw-exit-opacity': 'initial',
          '--tw-exit-scale': 'initial',
          '--tw-exit-rotate': 'initial',
          '--tw-exit-translate-x': 'initial',
          '--tw-exit-translate-y': 'initial',
          willChange: 'opacity, transform',
        },
        // Trigger helpers
        [`.${prefix}-run`]: { animationPlayState: 'running' },
        [`.${prefix}-paused`]: { animationPlayState: 'paused' },
        // Scroll-driven trigger (in supporting browsers)
        [`.${prefix}-view`]: {
          animationTimeline: 'view()',
          animationRangeStart: 'entry 20%',
          animationRangeEnd: 'cover 50%',
          animationFillMode: 'both',
        },
      });

      // Effect utilities
      matchUtilities(
        {
          'fade-in': (value) => ({ '--tw-enter-opacity': value as string }),
          'fade-out': (value) => ({ '--tw-exit-opacity': value as string }),
        },
        {
          values: theme('animationOpacity') as Record<string, string | number>,
        },
      );

      matchUtilities(
        {
          'zoom-in': (value) => ({ '--tw-enter-scale': value as string }),
          'zoom-out': (value) => ({ '--tw-exit-scale': value as string }),
        },
        { values: theme('animationScale') as Record<string, string | number> },
      );

      matchUtilities(
        {
          'spin-in': (value) => ({ '--tw-enter-rotate': value as string }),
          'spin-out': (value) => ({ '--tw-exit-rotate': value as string }),
        },
        { values: theme('animationRotate') as Record<string, string | number> },
      );

      matchUtilities(
        {
          'slide-in-from-top': (value) => ({
            '--tw-enter-translate-y': `-${value}`,
          }),
          'slide-in-from-bottom': (value) => ({
            '--tw-enter-translate-y': value as string,
          }),
          'slide-in-from-left': (value) => ({
            '--tw-enter-translate-x': `-${value}`,
          }),
          'slide-in-from-right': (value) => ({
            '--tw-enter-translate-x': value as string,
          }),
          'slide-out-to-top': (value) => ({
            '--tw-exit-translate-y': `-${value}`,
          }),
          'slide-out-to-bottom': (value) => ({
            '--tw-exit-translate-y': value as string,
          }),
          'slide-out-to-left': (value) => ({
            '--tw-exit-translate-x': `-${value}`,
          }),
          'slide-out-to-right': (value) => ({
            '--tw-exit-translate-x': value as string,
          }),
        },
        {
          values: theme('animationTranslate') as Record<
            string,
            string | number
          >,
        },
      );

      // Prefixed animation property utilities (to avoid overlapping Tailwind's transition utilities)
      matchUtilities(
        {
          'anim-duration': (value) => ({ animationDuration: value as string }),
        },
        {
          values: filterDefault(
            theme('animationDuration') as Record<string, any>,
          ),
        },
      );

      matchUtilities(
        { 'anim-delay': (value) => ({ animationDelay: value as string }) },
        { values: theme('animationDelay') as Record<string, any> },
      );

      matchUtilities(
        {
          'anim-ease': (value) => ({
            animationTimingFunction: value as string,
          }),
        },
        {
          values: filterDefault(
            theme('animationTimingFunction') as Record<string, any>,
          ),
        },
      );

      matchUtilities(
        { 'anim-fill': (value) => ({ animationFillMode: value as string }) },
        { values: theme('animationFillMode') as Record<string, any> },
      );

      matchUtilities(
        {
          'anim-direction': (value) => ({
            animationDirection: value as string,
          }),
        },
        { values: theme('animationDirection') as Record<string, any> },
      );

      matchUtilities(
        {
          'anim-repeat': (value) => ({
            animationIterationCount: value as string,
          }),
        },
        { values: theme('animationRepeat') as Record<string, any> },
      );
    };
  },
  {
    theme: {
      extend: {
        // Reuse Tailwind transition scales but scoped to animation-* theme keys
        animationDelay: ({ theme }: any) => ({
          ...(theme('transitionDelay') as Record<string, any>),
        }),
        animationDuration: ({ theme }: any) => ({
          0: '0ms',
          ...(theme('transitionDuration') as Record<string, any>),
        }),
        animationTimingFunction: ({ theme }: any) => ({
          ...(theme('transitionTimingFunction') as Record<string, any>),
        }),
        animationFillMode: {
          none: 'none',
          forwards: 'forwards',
          backwards: 'backwards',
          both: 'both',
        },
        animationDirection: {
          normal: 'normal',
          reverse: 'reverse',
          alternate: 'alternate',
          'alternate-reverse': 'alternate-reverse',
        },
        animationOpacity: ({ theme }: any) => ({
          DEFAULT: 0,
          ...(theme('opacity') as Record<string, any>),
        }),
        animationTranslate: ({ theme }: any) => ({
          DEFAULT: '100%',
          ...(theme('translate') as Record<string, any>),
        }),
        animationScale: ({ theme }: any) => ({
          DEFAULT: 0,
          ...(theme('scale') as Record<string, any>),
        }),
        animationRotate: ({ theme }: any) => ({
          DEFAULT: '30deg',
          ...(theme('rotate') as Record<string, any>),
        }),
        animationRepeat: {
          0: '0',
          1: '1',
          infinite: 'infinite',
        },
      },
    },
  },
);
