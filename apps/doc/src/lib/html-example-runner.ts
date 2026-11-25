/**
 * Runs the script of each HTML example rendered on the page (components/motion/HtmlExample.astro marks each one with a
 * `<template data-html-example="<name>">`), once per rendered example. The layout awaits it before it connects the runtime:
 * an example defines its motions before its `connectMotion()` line, and the page connects in its place
 * (lib/html-example.ts), so the definitions come first here too, and nothing is bound under an undefined name.
 */
import { htmlExamples } from 'virtual:udixio/html-examples';

/** The markers whose example has run: a page that the client router renders again has new markers, which run again. */
const started = new WeakSet<Element>();

export async function runHtmlExamples(): Promise<void> {
  const runs = [...document.querySelectorAll<HTMLTemplateElement>('template[data-html-example]')]
    .filter((marker) => !started.has(marker))
    .map(async (marker) => {
      started.add(marker);
      const name = marker.dataset.htmlExample ?? '';
      try {
        const example = await htmlExamples[name]?.();
        await example?.default();
      } catch (error) {
        // One broken example does not hold the runtime back from the rest of the page.
        console.error(`[doc] the HTML example "${name}" did not run`, error);
      }
    });
  await Promise.all(runs);
}
