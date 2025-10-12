import plugin from 'tailwindcss/plugin';
import { PluginAPI } from 'tailwindcss/dist/plugin';

export interface AnimationPluginOptions {
  prefix?: string;
}

// Animations inspired by temps.js but without overlapping Tailwind's transition utilities
// - prefixed utilities for animation properties: {prefix}-duration-*, {prefix}-delay-*, {prefix}-ease-*, {prefix}-fill-*, {prefix}-direction-*, {prefix}-repeat
// - usage: compose triggers ({prefix}-in|{prefix}-out or {prefix}-view*) + effects (fade/zoom/slide/spin) + params
export const animation = plugin.withOptions(
  ({ prefix = 'anim' }: AnimationPluginOptions) => {
    return ({ addBase, matchUtilities, addUtilities }: PluginAPI) => {
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

      // Triggers (unifiés): in/out + view*
      addUtilities({
        // in/out
        [`.${prefix}-in`]: {
          animationName: 'enter',
          animationDuration: '200ms',
          animationFillMode: 'both',
          animationPlayState: `var(--${prefix}-anim-state, paused)`,
          '--tw-enter-opacity': 'initial',
          '--tw-enter-scale': 'initial',
          '--tw-enter-rotate': 'initial',
          '--tw-enter-translate-x': 'initial',
          '--tw-enter-translate-y': 'initial',
          willChange: 'opacity, transform',
        },
        [`.${prefix}-out`]: {
          animationName: 'exit',
          animationDuration: '200ms',
          animationFillMode: 'both',
          animationPlayState: `var(--${prefix}-anim-state, paused)`,
          '--tw-exit-opacity': 'initial',
          '--tw-exit-scale': 'initial',
          '--tw-exit-rotate': 'initial',
          '--tw-exit-translate-x': 'initial',
          '--tw-exit-translate-y': 'initial',
          willChange: 'opacity, transform',
        },
        // run/pause state
        [`.${prefix}-run`]: { [`--${prefix}-anim-state`]: 'running' },
        [`.${prefix}-paused`]: { [`--${prefix}-anim-state`]: 'paused' },
        // scroll-driven
        [`.${prefix}-view`]: {
          animationTimeline: 'view()',
          animationRangeStart: `var(--${prefix}-range-start, entry 20%)`,
          animationRangeEnd: `var(--${prefix}-range-end, cover 50%)`,
          animationFillMode: 'both',
        },
        [`.${prefix}-view-block`]: {
          animationTimeline: 'view(block)',
          animationRangeStart: `var(--${prefix}-range-start, entry 20%)`,
          animationRangeEnd: `var(--${prefix}-range-end, cover 50%)`,
          animationFillMode: 'both',
        },
        [`.${prefix}-view-inline`]: {
          animationTimeline: 'view(inline)',
          animationRangeStart: `var(--${prefix}-range-start, entry 20%)`,
          animationRangeEnd: `var(--${prefix}-range-end, cover 50%)`,
          animationFillMode: 'both',
        },
        // aliases
        [`.${prefix}-view-y`]: {
          animationTimeline: 'view(block)',
          animationRangeStart: `var(--${prefix}-range-start, entry 20%)`,
          animationRangeEnd: `var(--${prefix}-range-end, cover 50%)`,
          animationFillMode: 'both',
        },
        [`.${prefix}-view-x`]: {
          animationTimeline: 'view(inline)',
          animationRangeStart: `var(--${prefix}-range-start, entry 20%)`,
          animationRangeEnd: `var(--${prefix}-range-end, cover 50%)`,
          animationFillMode: 'both',
        },
      });

      // Data-attribute triggers
      addBase({
        [`[data-${prefix}-run]`]: { [`--${prefix}-anim-state`]: 'running' },
        [`[data-${prefix}-paused]`]: { [`--${prefix}-anim-state`]: 'paused' },
      });

      // Effets
      matchUtilities(
        {
          'fade-in': (value) => ({ '--tw-enter-opacity': value }),
          'fade-out': (value) => ({ '--tw-exit-opacity': value }),
        },
        {
          values: {
            DEFAULT: '0',
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
      );

      matchUtilities(
        { 'zoom-in': (value) => ({ '--tw-enter-scale': value }) },
        {
          values: {
            DEFAULT: '.95',
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
      );

      matchUtilities(
        { 'zoom-out': (value) => ({ '--tw-exit-scale': value }) },
        {
          values: {
            DEFAULT: '.9',
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
      );

      matchUtilities(
        {
          'spin-in': (value) => ({ '--tw-enter-rotate': value }),
          'spin-out': (value) => ({ '--tw-exit-rotate': value }),
        },
        {
          values: {
            DEFAULT: '6deg',
            1: '1deg',
            2: '2deg',
            3: '3deg',
            6: '6deg',
            12: '12deg',
            30: '30deg',
            45: '45deg',
            90: '90deg',
            180: '180deg',
          },
        },
      );

      matchUtilities(
        {
          'slide-in-from-top': (value) => ({
            '--tw-enter-translate-y': `-${value}`,
          }),
          'slide-in-from-bottom': (value) => ({
            '--tw-enter-translate-y': value,
          }),
          'slide-in-from-left': (value) => ({
            '--tw-enter-translate-x': `-${value}`,
          }),
          'slide-in-from-right': (value) => ({
            '--tw-enter-translate-x': value,
          }),
          'slide-out-to-top': (value) => ({
            '--tw-exit-translate-y': `-${value}`,
          }),
          'slide-out-to-bottom': (value) => ({
            '--tw-exit-translate-y': value,
          }),
          'slide-out-to-left': (value) => ({
            '--tw-exit-translate-x': `-${value}`,
          }),
          'slide-out-to-right': (value) => ({
            '--tw-exit-translate-x': value,
          }),
        },
        {
          values: {
            DEFAULT: '2rem',
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
        },
      );

      // Offsets de timeline
      matchUtilities(
        {
          [`${prefix}-start`]: (value) => ({
            [`--${prefix}-range-start`]: value,
          }),
          [`${prefix}-end`]: (value) => ({
            [`--${prefix}-range-end`]: value,
          }),
        },
        { values: {} },
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

      matchUtilities(
        { [`${prefix}-direction`]: (value) => ({ animationDirection: value }) },
        {
          values: {
            normal: 'normal',
            reverse: 'reverse',
            alternate: 'alternate',
            'alternate-reverse': 'alternate-reverse',
          },
        },
      );

      matchUtilities(
        {
          [`${prefix}-repeat`]: (value) => ({ animationIterationCount: value }),
        },
        {
          values: { 0: '0', 1: '1', infinite: 'infinite' },
        },
      );
    };
  },
);
