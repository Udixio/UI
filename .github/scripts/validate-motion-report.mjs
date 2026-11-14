import { readFileSync } from 'node:fs';

try {
  const report = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  if (typeof report.browser !== 'string' || !report.browser.trim() || report.cpuThrottlingRate !== 4 || !Array.isArray(report.results) || report.results.length !== 8) throw new Error('Invalid browser, CPU rate or result count');
  const expected = new Set(['waapi', 'animejs', 'css', 'motion'].flatMap(provider => [100, 1000].map(elements => `${provider}:${elements}`)));
  for (const result of report.results) {
    const key = `${result.provider}:${result.elements}`;
    if (!expected.delete(key)) throw new Error(`Unexpected or duplicate configuration: ${key}`);
    const metrics = [result.scriptMs, result.framesDropped, result.longAnimationFrames?.count, result.longAnimationFrames?.durationMs];
    if (!metrics.every(value => typeof value === 'number' && Number.isFinite(value))) throw new Error(`Invalid metrics: ${key}`);
  }
  if (expected.size) throw new Error('Missing configurations');
  console.log('Motion benchmark report contains eight configurations with finite metrics.');
} catch (error) {
  console.error(`Invalid motion benchmark report: ${error.message}`);
  process.exitCode = 1;
}
