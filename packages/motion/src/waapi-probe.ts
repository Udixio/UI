/** Experimental parser observation only; it does not establish semantic support. */
export type WaapiSyntaxProbeResult =
  | { status: 'accepted'; normalizedEasing: string }
  | { status: 'refused'; diagnostic: string }
  | { status: 'unknown'; diagnostic: string };

/** Probe in the target's realm without attaching nodes or creating an Animation. */
export function probeWaapiEasing(target: Element | null | undefined, easing: string): WaapiSyntaxProbeResult {
  const unknown = (diagnostic: string): WaapiSyntaxProbeResult => ({ status: 'unknown', diagnostic });
  try {
    if (!target || typeof target.animate !== 'function') return unknown('Target or animate unavailable');
    const doc = target.ownerDocument;
    const view = doc?.defaultView;
    if (!view || typeof doc.createElement !== 'function') {
      return unknown('Document, view, or KeyframeEffect unavailable');
    }
    const Effect = view.KeyframeEffect;
    if (typeof Effect !== 'function') return unknown('KeyframeEffect unavailable');
    const element = doc.createElement('div');
    const frames = [{ opacity: 0 }, { opacity: 1 }];
    const make = (value: string) => new Effect(element, frames, { duration: 100, easing: value });
    try {
      const control = make('linear');
      if (typeof control.getTiming !== 'function' || typeof control.getTiming().easing !== 'string') {
        return unknown('Control timing unavailable');
      }
    } catch {
      return unknown('Control failed');
    }
    let effect: KeyframeEffect;
    try {
      effect = make(easing);
    } catch (error) {
      try {
        const TypeErrorConstructor = view.TypeError;
        // Reject obvious substitutions and customized instanceof semantics. This
        // sanity check cannot authenticate an adversarially spoofed realm.
        if (typeof TypeErrorConstructor === 'function'
          && TypeErrorConstructor.name === 'TypeError'
          && !Object.prototype.hasOwnProperty.call(TypeErrorConstructor, Symbol.hasInstance)
          && /^function TypeError\(\)\s*\{\s*\[native code\]\s*\}$/.test(Function.prototype.toString.call(TypeErrorConstructor))
          && error instanceof TypeErrorConstructor) {
          return { status: 'refused', diagnostic: 'Candidate constructor threw a realm TypeError' };
        }
      } catch {
        // An inaccessible or invalid realm error constructor cannot identify refusal.
      }
      return unknown('Candidate constructor failed');
    }
    try {
      if (typeof effect.getTiming !== 'function') return unknown('Candidate timing unavailable');
      const normalizedEasing = effect.getTiming().easing;
      if (typeof normalizedEasing !== 'string') return unknown('Candidate timing unavailable');
      return { status: 'accepted', normalizedEasing };
    } catch {
      return unknown('Candidate timing failed');
    }
  } catch {
    return unknown('Context inaccessible');
  }
}
