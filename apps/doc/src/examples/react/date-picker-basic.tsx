import { useState } from 'react';
import { DatePicker } from '@udixio/ui-react';

export default function DatePickerBasicReact() {
  const [date, setDate] = useState<Date | null>(new Date());

  return (
    <div className="flex flex-col items-center gap-4">
      <DatePicker value={date} onChange={setDate} />
      <p className="text-body-medium">
        Selected: {date ? date.toLocaleDateString() : '-'}
      </p>
    </div>
  );
}
