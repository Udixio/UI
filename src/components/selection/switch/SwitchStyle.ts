import { ClassNameComponent, StylesHelper } from '@utils/index';
import { SwitchElement, SwitchState } from './Switch';

export const SwitchStyle: ClassNameComponent<SwitchState, SwitchElement> = ({
  isSelected,
  disabled,
  inactiveIcon,
}) => {
  return {
    switch: StylesHelper.classNames([
      'group w-[52px] h-[32px] outline-none rounded-full  border-2 flex items-center',

      { 'bg-on-surface/[0.12] border-transparent': disabled },
      {
        applyWhen: !disabled,
        styles: [
          'cursor-pointer ',
          { 'bg-primary  border-primary': isSelected },
          { 'bg-surface-container border-outline': !isSelected },
        ],
      },
      // { 'justify-start': !isSelected },
      // { 'justify-end': isSelected },
    ]),
    handleContainer: StylesHelper.classNames([
      'flex items-center justify-center absolute',
      { 'left-[14px]': !isSelected },
      { 'right-[14px]': isSelected },
    ]),
    handle: StylesHelper.classNames([
      'transition-all duration-100  z-10 rounded-full  flex items-center justify-center',
      { 'w-[16px] h-[16px]': !isSelected && !inactiveIcon },
      { 'w-[24px] h-[24px]': !(!isSelected && !inactiveIcon) },
      {
        applyWhen: !disabled,
        styles: [
          'cursor-pointer group-active:h-[28px] group-active:w-[28px]',
          { 'bg-on-primary group-hover:bg-primary-container': isSelected },
          { 'bg-outline group-hover:bg-on-surface-variant': !isSelected },
        ],
      },
      { 'bg-surface': disabled },
    ]),
    handleStateLayer: StylesHelper.classNames([
      'w-[40px] h-[40px] -z-10 rounded-full absolute',
      { 'group-state-primary': !disabled },
    ]),
    icon: StylesHelper.classNames([
      'w-[16px] h-[16px]',
      {
        applyWhen: !disabled,
        styles: [
          { 'text-on-primary-container': isSelected },
          { 'text-on-primary': !isSelected },
        ],
      },
      { 'text-on-surface/[0.38]': disabled },
    ]),
  };
};
