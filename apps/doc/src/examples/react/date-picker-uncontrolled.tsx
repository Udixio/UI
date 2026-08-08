import { DatePicker } from '@udixio/ui-react';

export default function DatePickerUncontrolledReact() {
  return (
    <DatePicker
      defaultValue={new Date(2024, 5, 15)}
      onChange={(date) => console.log('Selected:', date)}
    />
  );
}
