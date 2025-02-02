import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type React from 'react';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { classNames } from '../utils';

export interface Props {
  icon: IconDefinition;
  colors?: string[];
  className?: string;
}

export const Icon: React.FC<Props> = ({ icon, colors = [], className }) => {
  const getColorStyle = (colors: string[]) => {
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
    <FontAwesomeIcon
      icon={icon}
      className={classNames(className, {
        'h-full': !className?.includes('h-'),
      })}
      style={getColorStyle(colors)}
    />
  );
};
