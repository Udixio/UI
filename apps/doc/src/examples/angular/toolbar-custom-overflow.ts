import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconButton, Toolbar } from '@udixio/ui-angular';
import { iContentCopy } from '@udixio/icons-rounded-400/content_copy';
import { iDelete } from '@udixio/icons-rounded-400/delete';
import { iMoreVert } from '@udixio/icons-rounded-400/more_vert';
import { iShare } from '@udixio/icons-rounded-400/share';
import { iSettings } from '@udixio/icons-rounded-400/settings';

const actions = [
  { id: 'share', label: 'Share presentation', icon: iShare },
  { id: 'settings', label: 'Presentation settings', icon: iSettings },
  { id: 'copy', label: 'Copy presentation link', icon: iContentCopy },
  { id: 'delete', label: 'Delete presentation', icon: iDelete },
];

@Component({
  selector: 'docs-toolbar-custom-overflow-angular',
  standalone: true,
  imports: [IconButton, Toolbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template
      #customMore
      let-label="label"
      let-ariaHasPopup="ariaHasPopup"
      let-ariaExpanded="ariaExpanded"
      let-toggle="toggle"
    >
      <udx-icon-button
        size="small"
        [label]="label"
        [icon]="moreIcon"
        [tooltip]="false"
        variant="filled"
        [aria-haspopup]="ariaHasPopup"
        [aria-expanded]="ariaExpanded"
        (click)="toggle()"
      />
    </ng-template>
    <udx-toolbar
      variant="floating"
      accessibleLabel="Presentation tools"
      [actions]="actions"
      [maxVisible]="1"
      [more]="moreOptions"
      [moreTemplate]="customMore"
    />
  `,
})
export class ToolbarCustomOverflowAngular {
  protected readonly actions = actions;
  protected readonly moreOptions = { label: 'More presentation tools' };
  protected readonly moreIcon = iMoreVert;
}
