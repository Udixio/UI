import { ReactProps } from '../utils';
import { ToolTipInterface } from '../interfaces';
import { toolStyle } from '../styles';
import { Button } from './Button';

/**
 * The Button component is a versatile component that can be used to trigger actions or to navigate to different sections of the application
 */
export const ToolTip = ({
  variant = 'plain',
  buttons,
  className,
  children,
  title,
  text,
  position,
}: ReactProps<ToolTipInterface>) => {
  if (!Array.isArray(buttons)) {
    buttons = [buttons];
  }

  const styles = toolStyle({
    variant,
    buttons,
    className,
    title,
    text,
    position,
  });

  return (
    <div className={styles.toolTip}>
      {children}
      <div className={styles.container}>
        {title && <div className={styles.subHead}>{title}</div>}
        <div className={styles.supportingText}>{text}</div>
        {buttons && (
          <div className={styles.actions}>
            {buttons.map((buttonArgs) => (
              <Button size={'small'} variant={'text'} {...buttonArgs} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
