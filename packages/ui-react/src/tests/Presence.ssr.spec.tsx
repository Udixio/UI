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

  it('renders a Motion that is not present hidden, with its content in the server HTML', () => {
    const html = renderToString(
      <Motion as="nav" name="fade" present={false}>
        <a href="/docs">Docs</a>
      </Motion>,
    );

    expect(html).toBe('<nav hidden=""><a href="/docs">Docs</a></nav>');
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
