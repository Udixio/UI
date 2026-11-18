/**
 * The code of the "Scroll to a target" tile on the root page: excerpts of the `motion-scroll` examples. Every line is copied
 * from an example, never edited; a `// …` or `<!-- … -->` line marks what is left out.
 */

export const html = `// …
const box = document.getElementById('box');
const two = document.getElementById('two');
const { finished } = scrollTo(two, {
  container: box,
  focus: true,
});`;

export const react = `const box = useRef<HTMLDivElement>(null);
const two = useRef<HTMLElement>(null);
const scroll = () => {
  scrollTo(two.current!, {
    container: box.current!,
    focus: true,
  });
};`;

export const angular = `protected toTwo(): void {
  scrollTo(this.two().nativeElement, {
    container: this.box().nativeElement,
    focus: true,
  });
}`;

export const svelte = `let box: HTMLElement;
let two: HTMLElement;
function toTwo() {
  scrollTo(two, {
    container: box,
    focus: true,
  });
}`;
