// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  createBadgeAnchorController,
  createBadgeTransitionController,
} from './badge.js';

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

  it('keeps the container classes on the box, and takes them back on destroy', () => {
    const host = document.createElement('span');
    host.className = 'own';
    document.body.appendChild(host);
    let classes = 'relative mt-4';
    const controller = createBadgeAnchorController({
      host,
      badge: badgeElement(),
      className: () => classes,
    });

    expect(host.className).toBe('own relative mt-4');

    classes = 'relative ring-2';
    controller.update();
    expect(host.className).toBe('own relative ring-2');

    controller.destroy();
    expect(host.className).toBe('own');
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

/** Lets the promises of a finished motion settle, then reads the final state. */
function flushMotion(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}

describe('badge transition controller', () => {
  it('shows the badge: visibility cleared, then scaled and faded in to its end state', () => {
    const element = document.createElement('span');
    element.style.visibility = 'hidden';

    createBadgeTransitionController({
      element,
      reducedMotion: () => false,
    }).setVisible(true);

    expect(element.style.visibility).toBe('');
    // At rest the end state (opacity 1, scale 1) is the stylesheet's: the motion writes nothing inline.
    expect(element.style.opacity).toBe('');
    expect(element.style.scale).toBe('');
    expect(element.hasAttribute('inert')).toBe(false);
  });

  it('scales and fades the badge out, and takes it out of painting once the exit has finished', async () => {
    const element = document.createElement('span');

    createBadgeTransitionController({
      element,
      reducedMotion: () => false,
    }).setVisible(false);

    expect(element.style.opacity).toBe('0');
    expect(element.style.scale).toBe('0');
    expect(element.hasAttribute('inert')).toBe(true);
    expect(element.style.visibility).toBe('');

    await flushMotion();
    expect(element.style.visibility).toBe('hidden');
  });

  it('applies the end state at once when instant, without waiting for the exit', () => {
    const element = document.createElement('span');
    const controller = createBadgeTransitionController({
      element,
      reducedMotion: () => false,
    });
    controller.setVisible(true);

    controller.setVisible(false, true);
    expect(element.style.visibility).toBe('hidden');
    expect(element.style.opacity).toBe('0');
    expect(element.hasAttribute('inert')).toBe(true);

    controller.setVisible(true, true);
    expect(element.style.visibility).toBe('');
    expect(element.style.opacity).not.toBe('0');
    expect(element.hasAttribute('inert')).toBe(false);
  });

  it('jumps to the end state when the user prefers reduced motion', () => {
    const element = document.createElement('span');
    const controller = createBadgeTransitionController({
      element,
      reducedMotion: () => true,
    });

    controller.setVisible(true);
    expect(element.style.visibility).toBe('');
    expect(element.style.opacity).not.toBe('0');
    expect(element.hasAttribute('inert')).toBe(false);

    controller.setVisible(false);
    expect(element.style.visibility).toBe('hidden');
    expect(element.style.opacity).toBe('0');
    expect(element.hasAttribute('inert')).toBe(true);
  });

  it('ends visible when shown again before the hide has finished', async () => {
    const element = document.createElement('span');
    const controller = createBadgeTransitionController({
      element,
      reducedMotion: () => false,
    });

    controller.setVisible(false);
    controller.setVisible(true);
    await flushMotion();

    expect(element.style.visibility).toBe('');
    expect(element.style.opacity).toBe('');
    expect(element.hasAttribute('inert')).toBe(false);
  });

  it('releases the badge on destroy, and a pending hide no longer hides it', async () => {
    const element = document.createElement('span');
    const controller = createBadgeTransitionController({
      element,
      reducedMotion: () => false,
    });

    controller.setVisible(false);
    controller.destroy();
    await flushMotion();

    expect(element.style.visibility).toBe('');
    expect(element.style.opacity).toBe('');
    expect(element.hasAttribute('inert')).toBe(false);
    expect(element.hasAttribute('data-presence')).toBe(false);
  });
});

describe('badge motion source', () => {
  it('does not import anime.js', () => {
    const source = readFileSync(resolve(__dirname, 'badge.ts'), 'utf8');

    expect(source).not.toContain('animejs');
  });
});
