import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Search } from '@udixio/ui-angular';

@Component({
  selector: 'docs-search-form-angular',
  standalone: true,
  imports: [Search],
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
      <button
        type="submit"
        class="rounded-full bg-primary px-4 py-2 text-label-large text-on-primary"
      >
        Submit native form
      </button>
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
