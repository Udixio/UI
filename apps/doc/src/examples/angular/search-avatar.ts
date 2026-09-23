import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Search } from '@udixio/ui-angular';

@Component({
  selector: 'docs-search-avatar-angular',
  standalone: true,
  imports: [Search],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-search label="Search workspace" placeholder="Search workspace">
      <span
        search-avatar
        class="flex size-[30px] items-center justify-center rounded-full bg-primary text-label-small text-on-primary"
        aria-hidden="true"
      >
        JD
      </span>
    </udx-search>
  `,
})
export class SearchAvatarAngular {}
