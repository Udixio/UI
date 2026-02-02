import {
  type ClassNameComponent,
  classNames,
  createUseClassNames,
  defaultClassNames,
} from '../utils';
import { DatePickerInterface } from '../interfaces/date-picker.interface';

const datePickerConfig: ClassNameComponent<DatePickerInterface> = ({
  hasSelected,
}) => ({
  datePicker: classNames(
    'inline-flex flex-col bg-surface-container-high rounded-[28px] p-3 shadow-sm select-none', // Using shadow-sm as placeholder for elevation
    'min-w-[320px]',
  ),
  header: classNames('flex items-center justify-between h-12 mb-2 px-2'),
  monthNav: classNames(
    'flex items-center justify-center w-10 h-10 rounded-full text-on-surface-variant hover:bg-on-surface-variant/8 transition-colors cursor-pointer',
  ),
  monthLabel: classNames(
    'text-label-large text-on-surface font-bold capitalize',
  ),
  weekDays: classNames('grid grid-cols-7 mb-2'),
  weekDay: classNames(
    'h-10 flex items-center justify-center text-body-small text-on-surface-variant',
  ),
  daysGrid: classNames('grid grid-cols-7 row-auto gap-y-2'),
  dayCell: classNames('flex items-center justify-center  h-10 p-0 relative'),
  dayButton: classNames(
    'w-10 h-10 rounded-full flex items-center justify-center text-body-large transition-all duration-200 relative overflow-hidden z-10 outline-none',
    // Base style is implicit text-on-surface
  ),
});

export const datePickerStyle = defaultClassNames<DatePickerInterface>(
  'datePicker',
  datePickerConfig,
);

export const useDatePickerStyle = createUseClassNames<DatePickerInterface>(
  'datePicker',
  datePickerConfig,
);
