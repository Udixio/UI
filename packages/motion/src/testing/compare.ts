import type { VisualState } from './visual-state.js';

export const TOLERANCES = { opacity: 0.02, length: 1, scale: 0.01, angle: 0.5 };

export function compareSamples(a: VisualState[], b: VisualState[], tol: typeof TOLERANCES = TOLERANCES): { ok: boolean; failures: string[] } {
  const failures: string[] = [];
  if (a.length !== b.length) failures.push(`length : ${a.length} vs ${b.length}`);
  const properties = { opacity: tol.opacity, x: tol.length, y: tol.length, scaleX: tol.scale, scaleY: tol.scale, rotate: tol.angle } as const;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    for (const prop of Object.keys(properties) as (keyof VisualState)[]) {
      if (!Number.isFinite(a[i][prop]) || !Number.isFinite(b[i][prop]) || Math.abs(a[i][prop] - b[i][prop]) > properties[prop]) {
        failures.push(`${prop} @ ${i} : ${a[i][prop]} vs ${b[i][prop]}`);
      }
    }
  }
  return { ok: failures.length === 0, failures };
}
