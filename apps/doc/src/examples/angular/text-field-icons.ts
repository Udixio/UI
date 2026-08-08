import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TextField } from '@udixio/ui-angular';
import { iSearch } from '@udixio/icons-rounded-400/search';
import { iClose } from '@udixio/icons-rounded-400/close';

@Component({
  selector: 'text-field-icons-angular-example',
  standalone: true,
  imports: [TextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4">
      <lib-text-field label="Search" name="q" [leadingIcon]="iSearch" />
      <lib-text-field label="Amount" name="amount" suffix="kg" />
      <lib-text-field label="Search" name="q2" [trailingIcon]="iClose" />
    </div>
  `,
})
export class TextFieldIconsAngular {
  protected readonly iSearch = iSearch;
  protected readonly iClose = iClose;
}
