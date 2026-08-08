import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { SvgImport } from '@udixio/core';
import { Icon } from './icon';

const rawIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>';

const svgImport: SvgImport = {
  src: '/star.svg',
  width: 24,
  height: 24,
  format: 'svg',
};

const fontAwesomeIcon: IconDefinition = {
  prefix: 'fas',
  iconName: 'star',
  icon: [512, 512, [], 'f005', 'M0 0h512v512H0z'],
} as IconDefinition;

describe('Icon', () => {
  let fixture: ComponentFixture<Icon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Icon],
    }).compileComponents();
    fixture = TestBed.createComponent(Icon);
  });

  it('themes a raw SVG icon through the inherited color', () => {
    fixture.componentRef.setInput('icon', rawIcon);
    fixture.componentRef.setInput('colors', ['#ff0000']);
    fixture.detectChanges();

    const span: HTMLSpanElement = fixture.nativeElement.querySelector('span');
    expect(span.className).toContain('fill-current');
    expect(span.style.color).toBe('rgb(255, 0, 0)');
    expect(span.style.filter).toBe('');
  });

  it('applies the recolor filter to an SvgImport icon when colors are set', () => {
    fixture.componentRef.setInput('icon', svgImport);
    fixture.componentRef.setInput('colors', ['#ffffff']);
    fixture.detectChanges();

    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.getAttribute('src')).toBe(svgImport.src);
    expect(img.style.filter).toBe('brightness(0) saturate(100%) invert(1)');
  });

  it('does not filter an SvgImport icon without colors', () => {
    fixture.componentRef.setInput('icon', svgImport);
    fixture.detectChanges();

    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.style.filter).toBe('');
  });

  it('themes a FontAwesome icon with one or two colors', () => {
    fixture.componentRef.setInput('icon', fontAwesomeIcon);
    fixture.componentRef.setInput('colors', ['#00ff00']);
    fixture.detectChanges();

    const svg: SVGElement = fixture.nativeElement.querySelector('svg');
    expect(svg.style.color).toBe('rgb(0, 255, 0)');

    fixture.componentRef.setInput('colors', ['#00ff00', '#0000ff']);
    fixture.detectChanges();

    expect(svg.style.getPropertyValue('--fa-primary-color')).toBe('#00ff00');
    expect(svg.style.getPropertyValue('--fa-secondary-color')).toBe(
      '#0000ff',
    );
  });
});
