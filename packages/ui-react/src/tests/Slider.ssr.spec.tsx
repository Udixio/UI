// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { Slider } from '../lib/components/Slider.js';

it('renders the named slider and a hidden indicator without DOM globals', () => {
  expect(typeof document).toBe('undefined');
  const html = renderToString(<Slider name="volume" aria-label="Volume" defaultValue={30} />);
  expect(html).toContain('role="slider"');
  expect(html).toContain('aria-valuenow="30"');
  expect(html).toContain('scale:0');
  expect(html).not.toMatch(/\sdata-udx-slider-motion-reduce(?:=|\s|>)/);
});
