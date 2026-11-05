import type { MotionProvider, MotionRequest } from '../contract.js';
import { readVisualState, type VisualState } from './visual-state.js';

export type Scenario = { name: string; family: string; request: Omit<MotionRequest, 'target'>; initialStyle?: Partial<CSSStyleDeclaration>; samples: number[] };

export async function runScenario(provider: MotionProvider, scenario: Scenario): Promise<VisualState[]> {
  const target = document.createElement('div');
  Object.assign(target.style, scenario.initialStyle);
  document.body.append(target);
  let handle: ReturnType<MotionProvider['animate']> | undefined;
  try {
    handle = provider.animate({ ...scenario.request, target });
    handle.pause();
    return scenario.samples.map((progress) => {
      handle!.seek(progress * handle!.duration);
      return readVisualState(target);
    });
  } finally {
    handle?.cancel();
    target.remove();
  }
}
