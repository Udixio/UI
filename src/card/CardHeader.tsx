import type { FunctionComponent, ReactNode } from 'react';

export interface CardHeaderProps {
  /**
   * Optional class name for the card component.
   */
  className?: string;

  /**
   * avatar of header card component.
   */
  avatar?: ReactNode;

  /**
   * Title of header in card component.
   */
  title: string;

  /**
   * Sub-title of header in card component.
   */
  subTitle?: string;
}

/**
 * The HeadCard component is a component that can be used to add the header of the card
 */
export const CardHeader: FunctionComponent<CardHeaderProps> = ({
  className,
  avatar,
  title,
  subTitle,
}: CardHeaderProps) => {
  return (
    <header className={className + ' flex items-center gap-4 py-3 pl-4 pr-1'}>
      {avatar && avatar}
      <div>
        <p className={'text-title-medium'}>{title}</p>
        {subTitle && <p className={'text-body-medium'}>{subTitle}</p>}
      </div>
    </header>
  );
};
