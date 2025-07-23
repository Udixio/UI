import type React from 'react';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { classNames } from '../utils';

interface Props {
  icon: IconDefinition;
  colors?: string[];
  className?: string;
}

export const Icon: React.FC<Props> = ({ icon, colors = [], className }) => {
  const { icon: iconData } = icon; // Extraction des données de l'icône.
  const [width, height, , , svgPathData] = iconData || [];

  const getColorStyle = (colors: string[]): React.CSSProperties => {
    switch (colors.length) {
      case 2:
        return {
          '--fa-primary-color': colors[0] || 'inherit',
          '--fa-secondary-color': colors[1] || 'inherit',
        } as React.CSSProperties;
      case 1:
        return { color: colors[0] } as React.CSSProperties;
      default:
        return {};
    }
  };

  return (
    <svg
      className={classNames('size-5 box-content', className)}
      style={{
        ...getColorStyle(colors),
      }}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-hidden="true"
    >
      {typeof svgPathData === 'string' ? (
        <path className={'fill-current'} d={svgPathData} />
      ) : (
        svgPathData.map((d, index) => <path key={index} d={d} />)
      )}
    </svg>
  );
};
