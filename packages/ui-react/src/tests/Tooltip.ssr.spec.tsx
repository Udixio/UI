// @vitest-environment node

import { renderToStaticMarkup } from 'react-dom/server';
import { Button, Tooltip } from '../lib/index.js';

describe('Tooltip (server rendering)', () => {
  it('renders without a DOM global', () => {
    expect(typeof document).toBe('undefined');
    expect(() =>
      renderToStaticMarkup(
        <Tooltip text="Copy to clipboard">
          <Button label="Hover me" />
        </Tooltip>,
      ),
    ).not.toThrow();
  });

  it('renders the trigger on the server', () => {
    const html = renderToStaticMarkup(
      <Tooltip text="Copy to clipboard">
        <Button label="Hover me" />
      </Tooltip>,
    );
    expect(html).toContain('Hover me');
  });
});
