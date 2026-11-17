import { DatePicker } from '@udixio/ui-react';

export default function DatePickerConstraintsReact() {
  return (
    <div className="flex flex-col items-center gap-8">
      <DatePicker
        locale="en-US"
        minDate={new Date(2024, 0, 1)}
        maxDate={new Date(2024, 11, 31)}
        defaultValue={new Date(2024, 5, 1)}
      />
      <DatePicker
        locale="en-US"
        shouldDisableDate={(date) => {
          const day = date.getDay();
          return day === 0 || day === 6;
        }}
        defaultValue={new Date(2024, 5, 1)}
      />
    </div>
  );
}
