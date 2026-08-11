import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button, Checkbox } from '@udixio/ui-angular';

@Component({
  selector: 'checkbox-validation-angular-example',
  standalone: true,
  imports: [Button, Checkbox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form
      class="flex flex-col items-start gap-3"
      novalidate
      (submit)="submit($event)"
    >
      <div class="flex items-center gap-3">
        <udx-checkbox
          id="checkbox-angular-terms"
          name="terms"
          value="accepted"
          [checked]="accepted"
          required
          [invalid]="invalid"
          aria-describedby="checkbox-angular-terms-description"
          (checkedChange)="accepted = $event"
        />
        <label for="checkbox-angular-terms">Accept the terms</label>
      </div>
      <p
        id="checkbox-angular-terms-description"
        [class]="invalid ? 'text-error' : 'text-on-surface-variant'"
        aria-live="polite"
      >
        {{ invalid ? 'You must accept the terms.' : 'Required to continue.' }}
      </p>
      <udx-button type="submit" label="Continue" />
    </form>
  `,
})
export class CheckboxValidationAngular {
  protected accepted = false;
  protected submitted = false;

  protected get invalid(): boolean {
    return this.submitted && !this.accepted;
  }

  protected submit(event: SubmitEvent): void {
    event.preventDefault();
    this.submitted = true;
  }
}
