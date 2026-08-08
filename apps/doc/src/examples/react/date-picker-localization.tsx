import { DatePicker } from '@udixio/ui-react';

export default function DatePickerLocalizationReact() {
  return (
    <div className="flex flex-wrap justify-center gap-8">
      <DatePicker locale="en-US" defaultValue={new Date(2024, 5, 1)} />
      <DatePicker
        locale="fr-FR"
        weekStartDay={1}
        defaultValue={new Date(2024, 5, 1)}
      />
    </div>
  );
}
