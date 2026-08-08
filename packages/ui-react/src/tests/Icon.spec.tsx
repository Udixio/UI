import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { SvgImport } from '@udixio/core';
import { iAdd } from '@udixio/icons-rounded-400/add';
import { Icon } from '../lib/index.js';

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
  it('themes a raw SVG icon through the inherited color', () => {
    const { container } = render(<Icon icon={iAdd} colors={['#ff0000']} />);
    const root = container.firstElementChild as HTMLElement;

    expect(root.className).toContain('fill-current');
    expect(root.style.color).toBe('rgb(255, 0, 0)');
    expect(root.style.filter).toBe('');
  });

  it('applies the recolor filter to an SvgImport icon when colors are set', () => {
    const { container } = render(
      <Icon icon={svgImport} colors={['#ffffff']} />,
    );
    const img = container.querySelector('img') as HTMLImageElement;

    expect(img).toHaveAttribute('src', svgImport.src);
    expect(img.style.filter).toBe('brightness(0) saturate(100%) invert(1)');
  });

  it('does not filter an SvgImport icon without colors', () => {
    const { container } = render(<Icon icon={svgImport} />);
    const img = container.querySelector('img') as HTMLImageElement;

    expect(img.style.filter).toBe('');
  });

  it('themes a FontAwesome icon with one or two colors', () => {
    const { container: single } = render(
      <Icon icon={fontAwesomeIcon} colors={['#00ff00']} />,
    );
    const singleSvg = single.querySelector('svg') as SVGElement;
    expect(singleSvg.style.color).toBe('rgb(0, 255, 0)');

    const { container: duo } = render(
      <Icon icon={fontAwesomeIcon} colors={['#00ff00', '#0000ff']} />,
    );
    const duoSvg = duo.querySelector('svg') as SVGElement;
    expect(duoSvg.style.getPropertyValue('--fa-primary-color')).toBe(
      '#00ff00',
    );
    expect(duoSvg.style.getPropertyValue('--fa-secondary-color')).toBe(
      '#0000ff',
    );
  });
});
