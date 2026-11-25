/** The scripts of the HTML examples, as modules (lib/html-example.ts): one loader per example name. */
declare module 'virtual:udixio/html-examples' {
  export const htmlExamples: Record<string, (() => Promise<{ default: () => Promise<void> }>) | undefined>;
}
