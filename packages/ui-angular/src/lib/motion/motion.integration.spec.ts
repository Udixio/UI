import '@udixio/motion/presets';
import { Component, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { getMotion, getMotions } from '@udixio/motion';
import { Motion } from './motion';

// Nothing is mocked here: the preset runs through the real core binding.
@Component({
  standalone: true,
  imports: [Motion],
  template: `<div data-testid="box" udxMotion="fade"></div>`,
})
class FadeHost {}

@Component({
  standalone: true,
  imports: [Motion],
  template: `<div udxMotion="angular-misspelt"></div>`,
})
class MisspeltHost {}

@Component({
  standalone: true,
  imports: [Motion],
  template: `<div udxMotion="rise" [udxMotionState]="state"></div>`,
})
class RevealHost {
  state = 0;
  @ViewChild(Motion) motion!: Motion;
}

@Component({
  standalone: true,
  imports: [Motion],
  template: `<nav data-testid="menu" udxMotion="fade" [udxMotionPresent]="open"><a href="/docs">Docs</a></nav>`,
})
class MenuHost {
  open = true;
}

@Component({
  standalone: true,
  imports: [Motion],
  template: `<div data-testid="box" udxMotion="fade slide press shake"></div>`,
})
class ListedHost {
  @ViewChild(Motion) motion!: Motion;
}

const waitFor = async (condition: () => boolean, timeout = 3000) => {
  const started = Date.now();
  while (!condition()) {
    if (Date.now() - started > timeout) throw new Error('condition not met');
    await new Promise(resolve => setTimeout(resolve, 20));
  }
};

describe('Motion (Angular directive, real core)', () => {
  it('plays the imported preset and marks the element present once it settles', async () => {
    const fixture = TestBed.createComponent(FadeHost);
    fixture.detectChanges();
    const box = fixture.nativeElement.querySelector(
      '[data-testid="box"]',
    ) as HTMLElement;

    await waitFor(() => box.getAttribute('data-motion-presence') === 'present');

    expect(box.getAttribute('data-motion-presence')).toBe('present');
    fixture.destroy();
  });

  it('keeps a node driven by udxMotionPresent in the DOM: hidden once its exit has played, shown again with its entry', async () => {
    const fixture = TestBed.createComponent(MenuHost);
    fixture.detectChanges();
    const menu = fixture.nativeElement.querySelector('[data-testid="menu"]') as HTMLElement;
    await waitFor(() => menu.getAttribute('data-motion-presence') === 'present');

    fixture.componentInstance.open = false;
    fixture.detectChanges();
    await waitFor(() => menu.style.display === '');
    expect(menu.hidden).toBe(true);
    expect(menu.isConnected).toBe(true);
    expect(menu.querySelector('a')?.getAttribute('href')).toBe('/docs');

    fixture.componentInstance.open = true;
    fixture.detectChanges();
    expect(menu.hidden).toBe(false);
    await waitFor(() => menu.getAttribute('data-motion-presence') === 'present');
    expect(menu.hasAttribute('inert')).toBe(false);
    fixture.destroy();
  });

  it('play() replays a reveal bound by name, through its core binding', async () => {
    const fixture = TestBed.createComponent(RevealHost);
    fixture.detectChanges();
    await waitFor(() => fixture.componentInstance.motion.bindingOf('view') !== undefined);
    const reveal = fixture.componentInstance.motion.bindingOf('view');
    expect(reveal?.verb).toBe('reveal');
    const replay = jest.spyOn(reveal!, 'play');

    fixture.componentInstance.motion.play();

    expect(replay).toHaveBeenCalledTimes(1);
    fixture.destroy();
  });

  it('replays a reveal bound by name when udxMotionState changes', async () => {
    const fixture = TestBed.createComponent(RevealHost);
    fixture.detectChanges();
    await waitFor(() => fixture.componentInstance.motion.bindingOf('view') !== undefined);
    const replay = jest.spyOn(fixture.componentInstance.motion.bindingOf('view')!, 'play');

    fixture.componentInstance.state = 1;
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(replay).toHaveBeenCalledTimes(1);
    fixture.destroy();
  });

  it('reports a misspelt name in development', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const fixture = TestBed.createComponent(MisspeltHost);
      fixture.detectChanges();

      expect(error).toHaveBeenCalledWith(expect.stringContaining('Unknown motion "angular-misspelt"'));
      fixture.destroy();
    } finally {
      error.mockRestore();
    }
  });

  it('binds one motion of each kind from a list, the first listed, and reports the others in development', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const fixture = TestBed.createComponent(ListedHost);
      fixture.detectChanges();
      const box = fixture.nativeElement.querySelector('[data-testid="box"]') as HTMLElement;
      const directive = fixture.componentInstance.motion;

      expect(getMotions(box)).toHaveLength(2);
      expect(directive.bindingOf('presence')).toBe(getMotion(box, 'presence'));
      expect(directive.bindingOf('emphasis')).toBe(getMotion(box, 'emphasis'));
      expect(error).toHaveBeenCalledWith(expect.stringContaining('"slide" ignored on an element that already has a presence motion ("fade")'));
      fixture.destroy();
    } finally {
      error.mockRestore();
    }
  });
});
