import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Chip } from '@udixio/ui-angular';

@Component({
  selector: 'docs-chip-input-angular',
  standalone: true,
  imports: [Chip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap gap-2">
      @for (tag of tags(); track tag) {
        <udx-chip [label]="tag" removable (remove)="removeTag(tag)" />
      }
    </div>
  `,
})
export class ChipInputAngular {
  protected readonly tags = signal(['React', 'TypeScript', 'Angular']);

  protected removeTag(tag: string): void {
    this.tags.update((current) => current.filter((item) => item !== tag));
  }
}
