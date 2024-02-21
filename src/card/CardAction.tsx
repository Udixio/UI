import type { FunctionComponent, ReactNode } from 'react';

export interface CardActionProps {
  /**
   * Optional class name for the card component.
   */
  className?: string;

  /**
   * content of avatar component.
   */
  children: string | ReactNode;
}

export const CardAction: FunctionComponent<CardActionProps> = ({
  className,
  children,
}: CardActionProps) => {
  return <div className={className + ` mt-8 px-3 flex gap-2`}>{children}</div>;
};
