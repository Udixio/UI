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
});
