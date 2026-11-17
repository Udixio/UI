import { useState } from 'react';
import { DatePicker } from '@udixio/ui-react';

export default function DatePickerBasicReact() {
  const [date, setDate] = useState<Date | null>(new Date(2024, 5, 1));

  return (
    <div className="flex flex-col items-center gap-4">
      <DatePicker locale="en-US" value={date} onChange={setDate} />
      <p className="text-body-medium">
        Selected: {date ? date.toLocaleDateString('en-US') : '-'}
      </p>
    </div>
  );
}
