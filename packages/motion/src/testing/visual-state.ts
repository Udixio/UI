export type VisualState = { opacity: number; x: number; y: number; scaleX: number; scaleY: number; rotate: number };

export function readVisualState(el: Element): VisualState {
  const style = getComputedStyle(el);
  let matrix = new DOMMatrix();
  if (style.translate !== 'none') {
    const values = style.translate.split(/\s+/).map(parseFloat);
    matrix = matrix.translate(values[0], values[1] ?? 0, values[2] ?? 0);
  }
  if (style.rotate !== 'none') {
    matrix = matrix.rotate(parseFloat(style.rotate));
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
