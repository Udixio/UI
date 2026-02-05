import type React from 'react';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { classNames } from '../utils';

export type Icon = IconDefinition | SvgImport | string;

interface SvgImport {
  src: string;
  width: number;
  height: number;
  format: string;
}

interface Props {
  icon: Icon;
  colors?: string[];
  className?: string;
}

export const Icon: React.FC<Props> = ({
  icon,
  colors = [],
  className,
  ...restProps
}) => {
  // Si c'est une chaîne de caractères (SVG raw)
  if (typeof icon === 'string') {
    let svgContent = icon;
    let colorAttrs = '';

    if (colors[0]) {
      colorAttrs = ` fill="${colors[0]}" color="${colors[0]}"`;
      // Remplacer les paths existants pour utiliser currentColor
      svgContent = svgContent.replace(
        /<path([^>]*?)>/g,
        '<path$1 fill="currentColor">',
      );
    }

    // Remplacer la balise <svg> ouvrante pour :
    // 1. Supprimer width/height existants
    // 2. Ajouter width="100%" height="100%"
    // 3. Ajouter les attributs de couleur si nécessaire
    svgContent = svgContent.replace(/<svg([^>]*)>/, (_, attributes) => {
      // Supprime width="..." ou height="..." (avec guillemets simples ou doubles)
      const cleanAttrs = attributes.replace(
        /\s+(width|height)=["'][^"']*["']/g,
        '',
      );
      return `<svg${cleanAttrs} width="100%" height="100%"${colorAttrs}>`;
    });

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
      {...restProps}
    >
      {typeof svgPathData === 'string' ? (
        <path className={'fill-current'} d={svgPathData} />
      ) : (
        svgPathData.map((d, index) => <path key={index} d={d} />)
      )}
    </svg>
  );
};
