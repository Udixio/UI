/**
 * TRIAL (review 5, Q3): `udxMotion` on a Udixio component, with no wrapper. The host of a Udixio component is declared with
 * no box (`data-motion-box="child"`), and is `display: contents` by a class that yields to `[hidden]`: the core rule of an
 * element with no box binds its first element child, the component's root. The host carries the state (`hidden`, the
 * presence mark, `inert`), the root the pixels.
 */
import '@udixio/motion/presets';
import { Component, ViewChild, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { getMotion } from '@udixio/motion';
import { Button } from '../button/button';
import { Card } from '../card/card';
import { Chip } from '../chip/chip';
import { IconButton } from '../icon-button/icon-button';
import { TextField } from '../text-field/text-field';
import { Motion } from './motion';

@Component({
  standalone: true,
  imports: [Button, Motion],
  template: `<udx-button udxMotion="press" #m="udxMotion" [udxMotionState]="count" label="Save" [href]="href" />`,
})
class ButtonHost {
  count = 0;
  href: string | undefined = undefined;
  @ViewChild('m') motion!: Motion;
}

@Component({
  standalone: true,
  imports: [Card, Motion],
  template: `<udx-card udxMotion="fade" data-testid="card">Body</udx-card>`,
})
class CardHost {}

@Component({
  standalone: true,
  imports: [TextField, Motion],
  template: `<udx-text-field udxMotion="shake" label="Code" />`,
})
class TextFieldHost {}

@Component({
  standalone: true,
  imports: [Card, Motion],
  template: `<udx-card udxMotion="fade" [udxMotionPresent]="open()" data-testid="card">Weekly report</udx-card>`,
})
class PresentCardHost {
  readonly open = signal(true);
}

@Component({
  standalone: true,
  imports: [Card, Motion],
  template: `<udx-card udxMotion="fade" [udxMotionPresent]="false">Weekly report</udx-card>`,
})
class AbsentCardHost {}

@Component({
  standalone: true,
  imports: [Button, Card, Chip, IconButton, TextField],
  template: `
    <udx-button label="Save" />
    <udx-card class="p-4">Body</udx-card>
    <udx-chip label="Tag" />
    <udx-icon-button icon="close" label="Close" />
    <udx-text-field label="Code" />
  `,
})
class SeveralHosts {}

/** The class of a Udixio host, as Tailwind compiles it: display: contents, unless the host is hidden. */
const HOST_CLASS = '[&:not([hidden])]:contents';
const HOST_RULE = '.\\[\\&\\:not\\(\\[hidden\\]\\)\\]\\:contents:not([hidden]) { display: contents; }';

/** A host that has no box by its stylesheet, declared by data-motion-box="child": the declaration step C gives Udixio hosts. */
@Component({
  selector: 'docs-declared-host',
  standalone: true,
  host: { 'data-motion-box': 'child' },
  styles: [':host { display: contents; }'],
  template: `<button type="button">Go</button>`,
})
class DeclaredHost {}

@Component({
  standalone: true,
  imports: [DeclaredHost, Motion],
  template: `<docs-declared-host udxMotion="press" />`,
})
class DeclaredHostUser {}

describe('udxMotion on a Udixio component, with no wrapper (trial)', () => {
  it('binds the root of a component whose host is declared with no box by data-motion-box="child", not by its own style', () => {
    const fixture = TestBed.createComponent(DeclaredHostUser);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('docs-declared-host') as HTMLElement;
    expect(host.style.display).toBe('');
    expect(getMotion(host.querySelector('button')!, 'emphasis')?.verb).toBe('emphasize');
    fixture.destroy();
  });

  it('binds a press on udx-button: the motion is on its <button>, and play() and state reach it', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('udx-button') as HTMLElement;
    const button = host.querySelector('button') as HTMLButtonElement;
    const binding = getMotion(button, 'emphasis');
    expect(binding?.verb).toBe('emphasize');
    expect(fixture.componentInstance.motion.binding).toBe(binding);
    const play = jest.spyOn(binding!, 'play');
    fixture.componentInstance.motion.play();
    fixture.componentInstance.count = 1;
    fixture.detectChanges();
    expect(play).toHaveBeenCalledTimes(2);
    fixture.destroy();
  });

  it('follows the root when udx-button renders a link in place of its button', async () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('udx-button') as HTMLElement;
    const before = getMotion(host.querySelector('button')!, 'emphasis');
    fixture.componentInstance.href = '/docs';
    fixture.detectChanges();
    await Promise.resolve();
    const link = host.querySelector('a') as HTMLAnchorElement;
    expect(link).not.toBeNull();
    expect(getMotion(link, 'emphasis')).toBeDefined();
    expect(getMotion(link, 'emphasis')).not.toBe(before);
    expect(fixture.componentInstance.motion.binding).toBe(getMotion(link, 'emphasis'));
    fixture.destroy();
  });

  it('binds an appear on udx-card: its root takes the motion, and the host carries the presence mark', () => {
    const fixture = TestBed.createComponent(CardHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('udx-card') as HTMLElement;
    const card = host.firstElementChild as HTMLElement;
    expect(getMotion(card, 'presence')).toBeDefined();
    expect(host.hasAttribute('data-motion-presence')).toBe(true);
    expect(card.hasAttribute('data-motion-presence')).toBe(false);
    fixture.destroy();
  });

  it('raises no development warning: udx-button, udx-card and udx-text-field each render one root, the box', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      for (const host of [ButtonHost, CardHost, TextFieldHost]) {
        const fixture = TestBed.createComponent(host);
        fixture.detectChanges();
        fixture.destroy();
      }
      expect(warn.mock.calls.filter(([message]) => String(message).includes('data-motion-box'))).toEqual([]);
    } finally {
      warn.mockRestore();
    }
  });

  it('binds a shake on udx-text-field: its root, not its input', () => {
    const fixture = TestBed.createComponent(TextFieldHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('udx-text-field') as HTMLElement;
    const root = host.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('DIV');
    expect(getMotion(root, 'emphasis')?.verb).toBe('emphasize');
    expect(getMotion(root.querySelector('input')!, 'emphasis')).toBeUndefined();
    fixture.destroy();
  });
});

describe('a Udixio host carries the state, its root the pixels (step C)', () => {
  let sheet: HTMLStyleElement;
  beforeEach(() => {
    // jest has no Tailwind: the rule the class compiles to.
    sheet = document.createElement('style');
    sheet.textContent = HOST_RULE;
    document.head.append(sheet);
  });
  afterEach(() => sheet.remove());

  it('declares each Udixio host with no box by data-motion-box="child" and a class that yields to [hidden], not by an inline style', () => {
    const fixture = TestBed.createComponent(SeveralHosts);
    fixture.detectChanges();
    const hosts = [...(fixture.nativeElement as HTMLElement).children] as HTMLElement[];
    expect(hosts.map((host) => host.localName)).toEqual(['udx-button', 'udx-card', 'udx-chip', 'udx-icon-button', 'udx-text-field']);
    for (const host of hosts) {
      expect(host.getAttribute('data-motion-box')).toBe('child');
      expect(host.classList.contains(HOST_CLASS)).toBe(true);
      expect(host.style.display).toBe('');
      expect(getComputedStyle(host).display).toBe('contents');
      host.hidden = true;
      expect(getComputedStyle(host).display).toBe('none');
    }
    fixture.destroy();
  });

  it('[udxMotionPresent] on udx-card: hidden, the presence mark and inert on the host, the motion on the root, and hidden hides it', async () => {
    const fixture = TestBed.createComponent(PresentCardHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('udx-card') as HTMLElement;
    const card = host.firstElementChild as HTMLElement;
    expect(getMotion(host, 'presence')).toBe(getMotion(card, 'presence'));

    fixture.componentInstance.open.set(false);
    fixture.detectChanges();
    expect(host.hidden).toBe(true);
    expect(host.dataset['motionPresence']).toBe('exiting');
    expect(host.hasAttribute('inert')).toBe(true);
    expect(card.hidden).toBe(false);
    expect(card.hasAttribute('data-motion-presence')).toBe(false);
    expect(card.hasAttribute('inert')).toBe(false);
    // Displayed while its exit plays, then hidden.
    expect(getComputedStyle(host).display).toBe('contents');
    await waitFor(() => getComputedStyle(host).display === 'none');

    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    expect(host.hidden).toBe(false);
    expect(host.hasAttribute('inert')).toBe(false);
    expect(getComputedStyle(host).display).toBe('contents');
    expect(['entering', 'present']).toContain(host.dataset['motionPresence']);
    expect(card.hasAttribute('data-motion-presence')).toBe(false);
    fixture.destroy();
  });

  it('[udxMotionPresent]="false" from the first render: the host is hidden and not displayed, the root is not hidden', () => {
    const fixture = TestBed.createComponent(AbsentCardHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('udx-card') as HTMLElement;
    const card = host.firstElementChild as HTMLElement;
    expect(host.hidden).toBe(true);
    expect(getComputedStyle(host).display).toBe('none');
    expect(card.hidden).toBe(false);
    expect(getMotion(card, 'presence')).toBeDefined();
    expect(host.dataset['motionPresence']).toBe('exiting');
    fixture.destroy();
  });
});

/** Waits, a macrotask at a time, until `done` holds; fails after two seconds. */
async function waitFor(done: () => boolean): Promise<void> {
  const until = Date.now() + 2000;
  while (!done()) {
    if (Date.now() > until) throw new Error('timed out');
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}
