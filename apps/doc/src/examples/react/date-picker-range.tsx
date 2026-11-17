import { useState } from 'react';
import { DatePicker, type DateRange } from '@udixio/ui-react';

export default function DatePickerRangeReact() {
  const [range, setRange] = useState<DateRange | null>([
    new Date(2024, 5, 10),
    new Date(2024, 5, 20),
  ]);
  const [start, end] = range ?? [null, null];

  return (
    <div className="flex flex-col items-center gap-4">
      <DatePicker
        locale="en-US"
        mode="range"
        value={range}
        onChange={setRange}
      />
      <p className="text-body-medium text-center">
        Start: {start?.toLocaleDateString('en-US') ?? '-'}
        <br />
        End: {end?.toLocaleDateString('en-US') ?? '-'}
      </p>
    </div>
  );
}
