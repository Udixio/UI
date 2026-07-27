import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Chips } from '@udixio/ui-angular';

@Component({ selector: 'docs-chips-list-angular', standalone: true, imports: [Chips], changeDetection: ChangeDetectionStrategy.OnPush, template: `<lib-chips label="Media filters" [items]="items()" (itemsChange)="items.set($event)" />` })
export class ChipsListAngular { protected readonly items = signal([{ id: 'photos', label: 'Photos', selected: true }, { id: 'videos', label: 'Videos', removable: true }]); }
