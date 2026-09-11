// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { createBadgeAnchorController } from './badge.js';

function badgeElement(): HTMLElement {
  const badge = document.createElement('span');
  badge.className = 'badge';
  return badge;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('badge anchor controller', () => {
  it('appends the badge into the host and makes it the containing block', () => {
    const host = document.createElement('span');
    document.body.appendChild(host);
    const badge = badgeElement();

    const controller = createBadgeAnchorController({ host, badge });

    expect(controller.anchor).toBe(host);
    expect(badge.parentElement).toBe(host);
    expect(host.style.position).toBe('relative');
  });

  it('walks through display: contents hosts to the first box', () => {
    const host = document.createElement('udx-icon');
    host.style.display = 'contents';
    const box = document.createElement('span');
    host.appendChild(box);
    document.body.appendChild(host);
    const badge = badgeElement();

    const controller = createBadgeAnchorController({ host, badge });

    expect(controller.anchor).toBe(box);
    expect(badge.parentElement).toBe(box);
    expect(host.style.position).toBe('');
  });

  it('leaves a box the consumer already positioned alone', () => {
    const host = document.createElement('span');
    host.style.position = 'absolute';
    document.body.appendChild(host);

    const controller = createBadgeAnchorController({ host, badge: badgeElement() });
    controller.destroy();

    expect(host.style.position).toBe('absolute');
  });

  it('puts the badge back after the box re-rendered its content', () => {
    const host = document.createElement('span');
    document.body.appendChild(host);
    const badge = badgeElement();
    const controller = createBadgeAnchorController({ host, badge });

    host.innerHTML = '<svg></svg>';
    expect(badge.parentElement).toBeNull();

    controller.update();

    expect(badge.parentElement).toBe(host);
    expect(host.lastElementChild).toBe(badge);
  });

  it('moves to the new box when the host resolves to a different one', () => {
    const host = document.createElement('udx-icon');
    host.style.display = 'contents';
    const first = document.createElement('span');
    host.appendChild(first);
    document.body.appendChild(host);
    const badge = badgeElement();
    const controller = createBadgeAnchorController({ host, badge });

    const second = document.createElement('span');
    host.replaceChild(second, first);
    controller.update();

    expect(controller.anchor).toBe(second);
    expect(badge.parentElement).toBe(second);
    expect(second.style.position).toBe('relative');
    expect(first.style.position).toBe('');
  });

  it('removes the badge and restores the box on destroy', () => {
    const host = document.createElement('span');
    document.body.appendChild(host);
    const badge = badgeElement();
    const controller = createBadgeAnchorController({ host, badge });

    controller.destroy();

    expect(badge.parentElement).toBeNull();
    expect(host.style.position).toBe('');
  });
});
