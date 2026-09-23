import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Fab, Toolbar, type AngularToolbarAction } from '@udixio/ui-angular';
import { iAdd } from '@udixio/icons-rounded-400/add';
import { iMoreHoriz } from '@udixio/icons-rounded-400/more_horiz';
import { iRedo } from '@udixio/icons-rounded-400/redo';
import { iShare } from '@udixio/icons-rounded-400/share';
import { iUndo } from '@udixio/icons-rounded-400/undo';

@Component({
  selector: 'docs-toolbar-docked-angular',
  standalone: true,
  imports: [Fab, Toolbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="relative flex min-h-80 w-full flex-col overflow-hidden rounded-2xl border border-outline bg-surface-container-low"
    >
      <div class="flex flex-1 flex-col justify-center gap-2 p-6">
        <p class="text-title-medium">Document canvas</p>
        <p class="text-body-medium text-on-surface-variant">
          The docked toolbar stays attached to the bottom of this surface.
        </p>
        <p
          class="text-body-small text-on-surface-variant"
          role="status"
          aria-live="polite"
        >
          Last action: {{ lastAction() }}
        </p>
      </div>

      <div class="relative">
        <udx-fab
          class="absolute -top-8 right-4 z-10"
          label="Create document"
          [icon]="addIcon"
          (click)="setLastAction('Create document')"
        />
        <udx-toolbar
          accessibleLabel="Document actions"
          [actions]="actions"
          [maxVisible]="2"
          [more]="moreOptions"
        />
      </div>
    </div>
  `,
})
export class ToolbarDockedAngular {
  protected readonly addIcon = iAdd;
  protected readonly lastAction = signal('None');
  protected readonly actions: readonly AngularToolbarAction[] = [
    {
      id: 'undo',
      label: 'Undo',
      icon: iUndo,
      onClick: () => this.setLastAction('Undo'),
    },
    {
      id: 'redo',
      label: 'Redo',
      icon: iRedo,
      onClick: () => this.setLastAction('Redo'),
    },
    {
      id: 'share',
      label: 'Share document',
      icon: iShare,
      onClick: () => this.setLastAction('Share document'),
    },
  ];
  protected readonly moreOptions = {
    label: 'More document actions',
    icon: iMoreHoriz,
  };

  protected setLastAction(action: string): void {
    this.lastAction.set(action);
  }
}
