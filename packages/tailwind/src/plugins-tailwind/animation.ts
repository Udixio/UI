import plugin, { PluginAPI } from 'tailwindcss/plugin';

export interface AnimationPluginOptions {}

// Defines keyframes and utilities for scroll-triggered animations compatible with Tailwind syntax
export const animation = plugin.withOptions((options: AnimationPluginOptions) => {
  return ({ addBase, addUtilities }: Pick<PluginAPI, 'addBase' | 'addUtilities'>) => {
    // Keyframes definitions
    addBase({
      '@keyframes udx-fade': {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
      '@keyframes udx-fade-up': {
        '0%': { opacity: '0', transform: 'translate3d(0, 100px, 0)' },
        '100%': { opacity: '1', transform: 'translate3d(0, 0, 0)' },
      },
      '@keyframes udx-fade-down': {
        '0%': { opacity: '0', transform: 'translate3d(0, -100px, 0)' },
        '100%': { opacity: '1', transform: 'translate3d(0, 0, 0)' },
      },
      '@keyframes udx-fade-left': {
        '0%': { opacity: '0', transform: 'translate3d(100px, 0, 0)' },
        '100%': { opacity: '1', transform: 'translate3d(0, 0, 0)' },
      },
      '@keyframes udx-fade-right': {
        '0%': { opacity: '0', transform: 'translate3d(-100px, 0, 0)' },
        '100%': { opacity: '1', transform: 'translate3d(0, 0, 0)' },
      },
      '@keyframes udx-zoom-in': {
        '0%': { opacity: '0', transform: 'scale(0.95)' },
        '100%': { opacity: '1', transform: 'scale(1)' },
      },
      '@keyframes udx-zoom-out': {
        '0%': { opacity: '0.999', transform: 'scale(1.05)' },
        '100%': { opacity: '1', transform: 'scale(1)' },
      },
    });

    // Animation-name utilities. Duration/ease/delay should use Tailwind's built-in utilities
    addUtilities({
      '.animate-fade': {
        animationName: 'udx-fade',
        animationFillMode: 'both',
      },
      '.animate-fade-up': {
        animationName: 'udx-fade-up',
        animationFillMode: 'both',
      },
      '.animate-fade-down': {
        animationName: 'udx-fade-down',
        animationFillMode: 'both',
      },
      '.animate-fade-left': {
        animationName: 'udx-fade-left',
        animationFillMode: 'both',
      },
      '.animate-fade-right': {
        animationName: 'udx-fade-right',
        animationFillMode: 'both',
      },
      '.animate-zoom-in': {
        animationName: 'udx-zoom-in',
        animationFillMode: 'both',
      },
      '.animate-zoom-out': {
        animationName: 'udx-zoom-out',
        animationFillMode: 'both',
      },
      // Utility to bind animations to the element's view progress in supporting browsers
      '.aos-view': {
        // @ts-ignore - not in type defs
        animationTimeline: 'view()',
        animationFillMode: 'both',
        willChange: 'opacity, transform',
      },
    });
  };
});
