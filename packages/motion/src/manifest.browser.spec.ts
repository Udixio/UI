import { expect, it } from 'vitest';
import { validateMotionDocument } from './manifest.js';
it('validates identically in a browser', () => {
  expect(
    validateMotionDocument(
      JSON.parse(
        '{"version":1,"spec":{"verb":"appear","keyframes":[{"opacity":1}]}}',
      ),
    ).valid,
  ).toBe(true);
  expect(
    validateMotionDocument(
      JSON.parse(
        '{"version":1,"spec":{"verb":"appear","keyframes":[{"x":1e400}]}}',
      ),
    ),
  ).toMatchObject({
    valid: false,
    errors: [{ path: '/spec/keyframes/0/x', code: 'invalid_value' }],
  });
});
