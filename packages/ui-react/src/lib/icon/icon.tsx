import type React from 'react';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { classNames } from '../utils';

interface SvgImport {
  src: string;
  width: number;
  height: number;
  format: string;
}

interface Props {
  icon: IconDefinition | SvgImport | string;
  colors?: string[];
  className?: string;
}

export const Icon: React.FC<Props> = ({ icon, colors = [], className }) => {
  // Si c'est une chaîne de caractères (SVG raw)
  if (typeof icon === 'string') {
    // Modifier la couleur du SVG en remplaçant les attributs fill/stroke
    let svgContent = icon;
    if (colors[0]) {
      // Remplacer ou ajouter des attributs de couleur
      svgContent = svgContent.replace(
        /<svg([^>]*)>/,
        `<svg$1 fill="${colors[0]}" color="${colors[0]}">`,
      );
      // Remplacer les paths existants pour utiliser currentColor
      svgContent = svgContent.replace(
        /<path([^>]*?)>/g,
        '<path$1 fill="currentColor">',
      );
    }

    return (
      <div
        className={classNames(
          'size-5 box-content inline-flex fill-current',
          className,
        )}
        style={{ color: colors[0] || 'inherit' }}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    );
  }

  // Si c'est un objet SVG importé (cas précédent)
  if (icon && typeof icon === 'object' && 'src' in icon) {
    const svgImport = icon as SvgImport;
    return (
      <img
        src={svgImport.src}
        width={svgImport.width}
        height={svgImport.height}
        className={classNames('size-5 box-content', className)}
        style={{
          filter: colors[0]
            ? `brightness(0) saturate(100%) invert(1)`
            : undefined,
        }}
        alt=""
        aria-hidden="true"
      />
    );
  }

  // Si c'est une IconDefinition FontAwesome
  const faIcon = icon as IconDefinition;
  if (!faIcon?.prefix) {
    throw new Error(`Invalid icon type: ${typeof icon}`);
  }

  const { icon: iconData } = faIcon;
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
      style={{ ...getColorStyle(colors) }}
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
