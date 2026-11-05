export type VisualState = { opacity: number; x: number; y: number; scaleX: number; scaleY: number; rotate: number };

// CSS transforms use the border box for HTML elements by default. Computed
// width/height retain subpixel precision and avoid transformed viewport bounds.
function referenceSize(el: Element, style: CSSStyleDeclaration): [number, number] {
  if (el instanceof SVGGraphicsElement && !(el instanceof SVGSVGElement && !(el.parentElement instanceof SVGElement))) {
    if (style.transformBox === 'view-box') {
      const svg = el instanceof SVGSVGElement ? el : el.ownerSVGElement;
      if (svg) {
        const viewBox = svg.viewBox.baseVal;
        return [viewBox.width || svg.width.baseVal.value, viewBox.height || svg.height.baseVal.value];
      }
    }
    if (style.transformBox === 'stroke-box' || style.transformBox === 'border-box') {
      throw new Error('Percentage translations with SVG stroke-box are not supported');
    }
    const box = el.getBBox();
    return [box.width, box.height];
  }
  const value = (name: string) => parseFloat(style.getPropertyValue(name)) || 0;
  const contentBox = style.transformBox === 'content-box' || style.transformBox === 'fill-box';
  const size = (axis: 'width' | 'height', sides: [string, string]) => {
    const padding = sides.reduce((sum, side) => sum + value(`padding-${side}`), 0);
    const border = sides.reduce((sum, side) => sum + value(`border-${side}-width`), 0);
    const computed = value(axis);
    const content = style.boxSizing === 'border-box' ? computed - padding - border : computed;
    return contentBox ? content : content + padding + border;
  };
  return [size('width', ['left', 'right']), size('height', ['top', 'bottom'])];
}

function translateLength(value: string, reference: number): number {
  // Computed values are px, percentages, or a calc() combining those units.
  const terms = value.match(/[+-]?\s*(?:\d*\.)?\d+(?:e[+-]?\d+)?(?:px|%)/gi) ?? [];
  return terms.reduce((sum, term) => {
    const number = parseFloat(term.replace(/\s/g, ''));
    return sum + (term.endsWith('%') ? number * reference / 100 : number);
  }, 0);
}

export function readVisualState(el: Element): VisualState {
  const style = getComputedStyle(el);
  let matrix = new DOMMatrix();
  if (style.translate !== 'none') {
    const values = style.translate.match(/calc\([^)]*\)|[^\s]+/g) ?? [];
    const [width, height] = style.translate.includes('%') ? referenceSize(el, style) : [0, 0];
    matrix = matrix.translate(translateLength(values[0] ?? '0px', width), values[1] ? translateLength(values[1], height) : 0, values[2] ? translateLength(values[2], 0) : 0);
  }
  if (style.rotate !== 'none') {
    const parts = style.rotate.split(/\s+/);
    const angle = parseFloat(parts[parts.length - 1]);
    if (parts.length === 1) matrix = matrix.rotate(angle);
    else {
      const axis = parts[0] === 'x' ? [1, 0, 0] : parts[0] === 'y' ? [0, 1, 0] : parts[0] === 'z' ? [0, 0, 1] : parts.slice(0, 3).map(Number);
      matrix = matrix.rotateAxisAngle(axis[0], axis[1], axis[2], angle);
    }
  }
  if (style.scale !== 'none') {
    const values = style.scale.split(/\s+/).map(Number);
    matrix = matrix.scale(values[0], values[1] ?? values[0], values[2] ?? 1);
  }
  if (style.transform !== 'none') matrix = matrix.multiply(new DOMMatrix(style.transform));
  const scaleX = Math.hypot(matrix.a, matrix.b);
  const scaleY = scaleX ? (matrix.a * matrix.d - matrix.b * matrix.c) / scaleX : Math.hypot(matrix.c, matrix.d);
  return { opacity: Number(style.opacity), x: matrix.e, y: matrix.f, scaleX, scaleY, rotate: Math.atan2(matrix.b, matrix.a) * 180 / Math.PI };
}
