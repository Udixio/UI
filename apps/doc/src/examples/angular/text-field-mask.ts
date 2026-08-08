import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TextField } from '@udixio/ui-angular';

// Always renders in international form ("+33 6 85 51 14 11"): typing "+"
// opts in explicitly, and typing the national trunk "0" is recognized and
// dropped for the country code, the way a French number is dialed
// internationally -- either way the user only ever types digits they meant.
function maskFrenchPhone(raw: string): string {
  const hasPlus = raw.trimStart().startsWith('+');
  let digits = raw.replace(/\D/g, '');
  if (!hasPlus && !digits.startsWith('0')) {
    return (
      digits
        .slice(0, 10)
        .match(/.{1,2}/g)
        ?.join(' ') ?? ''
    );
  }
  if (!hasPlus) digits = `33${digits.slice(1)}`;
  digits = digits.slice(0, 11);
  const subscriber = digits.slice(2);
  const groups = [
    digits.slice(0, 2),
    subscriber.slice(0, 1),
    ...(subscriber.slice(1).match(/.{1,2}/g) ?? []),
  ].filter(Boolean);
  return `+${groups.join(' ')}`;
}

@Component({
  selector: 'text-field-mask-angular-example',
  standalone: true,
  imports: [TextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <lib-text-field label="Phone" [mask]="mask" /> `,
})
export class TextFieldMaskAngular {
  protected readonly mask = maskFrenchPhone;
}
