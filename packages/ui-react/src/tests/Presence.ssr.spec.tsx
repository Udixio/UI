// @vitest-environment node

import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Motion, Presence } from '../lib/index.js';

describe('Presence and Motion (server rendering)', () => {
  it('renders the current children, without DOM globals', () => {
    expect(typeof document).toBe('undefined');
    const html = renderToString(
      <ul>
        <Presence>
          {['a', 'b'].map((id) => (
            <Motion key={id} as="li" name="fade">
              {id}
            </Motion>
          ))}
        </Presence>
      </ul>,
    );

    expect(html).toBe('<ul><li>a</li><li>b</li></ul>');
  });

  it('renders nothing for a single conditional child that is absent', () => {
    expect(renderToString(<Presence>{false}</Presence>)).toBe('');
  });

  it('renders a Motion with its element, its props and its children', () => {
    const html = renderToString(
      <Motion as="p" name="rise" className="note">
        Saved
      </Motion>,
    );

    expect(html).toBe('<p class="note">Saved</p>');
  });
});
