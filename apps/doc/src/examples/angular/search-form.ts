import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button, Search } from '@udixio/ui-angular';

@Component({
  selector: 'docs-search-form-angular',
  standalone: true,
  imports: [Button, Search],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form
      class="flex w-full flex-col items-center gap-3"
      (submit)="handleSubmit($event)"
    >
      <udx-search
        id="documentation-email-search"
        label="Search by email"
        name="email"
        [(query)]="query"
        (searchSubmit)="submitted = $event"
        placeholder="name@example.com"
        inputMode="email"
        autoComplete="email"
        [maxLength]="120"
        required
        [spellCheck]="false"
      />
      <udx-button type="submit" size="small" label="Submit native form" />
      <p class="text-body-small text-on-surface-variant" role="status">
        {{ submitted ? 'Submitted: ' + submitted : 'Nothing submitted' }}
      </p>
    </form>
  `,
})
export class SearchFormAngular {
  protected query = '';
  protected submitted = '';

  protected handleSubmit(event: SubmitEvent): void {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const value = new FormData(form).get('email');
    this.submitted = typeof value === 'string' ? value : '';
  }
}
