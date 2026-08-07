import { Component, ElementRef, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnchorPositioner } from './anchor-positioner';

// jsdom lacks ResizeObserver; the fallback controller needs it to mount
// when the environment reports no CSS Anchor Positioning support.
class NoopResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
(globalThis as any).ResizeObserver ??= NoopResizeObserver;

@Component({
  standalone: true,
  imports: [AnchorPositioner],
  template: `
    <button #anchorEl>Anchor</button>
    <lib-anchor-positioner [anchor]="anchorRef()" [position]="position">
      <div class="content">Floating</div>
    </lib-anchor-positioner>
  `,
})
class Harness {
  readonly anchorRef = viewChild.required<ElementRef<HTMLButtonElement>>(
    'anchorEl',
  );
  position: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
}

describe('AnchorPositioner (Angular)', () => {
  let fixture: ComponentFixture<Harness>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Harness],
    }).compileComponents();
    fixture = TestBed.createComponent(Harness);
  });

  afterEach(() => {
    document.querySelectorAll('.content').forEach((el) => el.parentElement?.remove());
  });

  it('portals its content to document.body', () => {
    fixture.detectChanges();

    const floating = document.querySelector('.content');
    expect(floating).not.toBeNull();
    expect(fixture.nativeElement.contains(floating)).toBe(false);
    expect(document.body.contains(floating)).toBe(true);
  });

  it('removes the portaled node on destroy', () => {
    fixture.detectChanges();
    expect(document.querySelector('.content')).not.toBeNull();

    fixture.destroy();
    expect(document.querySelector('.content')).toBeNull();
  });
});
