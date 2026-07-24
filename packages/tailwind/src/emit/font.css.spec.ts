import { describe, expect, it } from 'vitest';
import { buildResolvedCss } from './test-utils';
import { fontCss } from './font.css';

const args = {
  fontStyles: {
    display: {
      large: {
        fontWeight: 400,
        fontSize: 3.5625,
        lineHeight: 4,
        letterSpacing: -0.015625,
        fontFamily: 'expressive',
      },
    },
  } as any,
  responsiveBreakPoints: { lg: 1.125 },
  fontFamily: {
    expressive: ['Roboto', 'sans-serif'],
    neutral: ['Roboto', 'sans-serif'],
  },
};

describe('fontCss', () => {
  it('emits .text-display-large with size, family and a responsive media rule', async () => {
    const css = fontCss(args);
    const resolved = await buildResolvedCss(css, [
      'text-display-large',
      'lg:text-display-large',
    ]);
    expect(resolved).toMatch(/\.text-display-large\s*\{/);
    expect(resolved).toContain('font-size: 3.5625rem');
    expect(resolved).toContain('"Roboto", "sans-serif"');
    // theme(--breakpoint-lg) resolves to 64rem (validated in the Task 1 spike)
    expect(resolved).toContain('64rem');
    // responsive: fontSize * 1.125 = 4.0078125rem at the lg breakpoint
    expect(resolved).toContain('4.0078125rem');
  });
});
