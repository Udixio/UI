import { TextField } from '@udixio/ui-react';
import { iSearch } from '@udixio/icons-rounded-400/search';
import { iClose } from '@udixio/icons-rounded-400/close';

export default function TextFieldIconsReact() {
  return (
    <div className="flex flex-col gap-4">
      <TextField label="Search" name="q" leadingIcon={iSearch} />
      <TextField label="Amount" name="amount" suffix="kg" />
      <TextField label="Search" name="q2" trailingIcon={iClose} />
    </div>
  );
}
