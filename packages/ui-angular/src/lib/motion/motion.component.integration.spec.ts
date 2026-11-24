/**
 * TRIAL (review 5, Q3): `udxMotion` on a Udixio component, with no wrapper. The host of a Udixio component is
 * `display: contents`: the core rule of an element with no box binds its first element child, the component's root.
 */
import '@udixio/motion/presets';
import { Component, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { getMotion } from '@udixio/motion';
import { Button } from '../button/button';
import { Card } from '../card/card';
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

describe('udxMotion on a Udixio component, with no wrapper (trial)', () => {
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

  it('binds an appear on udx-card: its root takes the presence', () => {
    const fixture = TestBed.createComponent(CardHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('udx-card') as HTMLElement;
    const card = host.firstElementChild as HTMLElement;
    expect(getMotion(card, 'presence')).toBeDefined();
    expect(card.hasAttribute('data-motion-presence')).toBe(true);
    expect(host.hasAttribute('data-motion-presence')).toBe(false);
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
