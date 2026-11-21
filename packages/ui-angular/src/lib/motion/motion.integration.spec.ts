import '@udixio/motion/presets';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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
  template: `<nav data-testid="menu" udxMotion="fade" [udxMotionPresent]="open"><a href="/docs">Docs</a></nav>`,
})
class MenuHost {
  open = true;
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

    await waitFor(() => box.getAttribute('data-presence') === 'present');

    expect(box.getAttribute('data-presence')).toBe('present');
    fixture.destroy();
  });

  it('keeps a node driven by udxMotionPresent in the DOM: hidden once its exit has played, shown again with its entry', async () => {
    const fixture = TestBed.createComponent(MenuHost);
    fixture.detectChanges();
    const menu = fixture.nativeElement.querySelector('[data-testid="menu"]') as HTMLElement;
    await waitFor(() => menu.getAttribute('data-presence') === 'present');

    fixture.componentInstance.open = false;
    fixture.detectChanges();
    await waitFor(() => menu.style.display === '');
    expect(menu.hidden).toBe(true);
    expect(menu.isConnected).toBe(true);
    expect(menu.querySelector('a')?.getAttribute('href')).toBe('/docs');

    fixture.componentInstance.open = true;
    fixture.detectChanges();
    expect(menu.hidden).toBe(false);
    await waitFor(() => menu.getAttribute('data-presence') === 'present');
    expect(menu.hasAttribute('inert')).toBe(false);
    fixture.destroy();
  });
});
