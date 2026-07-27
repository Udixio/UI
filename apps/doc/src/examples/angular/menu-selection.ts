import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Menu, MenuGroup, MenuHeadline, MenuItem } from '@udixio/ui-angular';

type Density = 'comfortable' | 'compact';
type Language = 'english' | 'french';

@Component({
  selector: 'docs-menu-selection-angular',
  standalone: true,
  imports: [Menu, MenuGroup, MenuHeadline, MenuItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-start justify-center gap-6">
      <lib-menu accessibleLabel="Editor preferences">
        <lib-menu-group label="Density">
          <lib-menu-item
            label="Comfortable"
            selectionType="single"
            [selected]="density() === 'comfortable'"
            (selectedChange)="selectDensity('comfortable', $event)"
          />
          <lib-menu-item
            label="Compact"
            selectionType="single"
            [selected]="density() === 'compact'"
            (selectedChange)="selectDensity('compact', $event)"
          />
        </lib-menu-group>
        <lib-menu-group label="Tools">
          <lib-menu-item
            label="Spell checking"
            selectionType="multiple"
            [selected]="spellCheck()"
            (selectedChange)="spellCheck.set($event)"
          />
          <lib-menu-item
            label="Grammar suggestions"
            selectionType="multiple"
            defaultSelected
          />
        </lib-menu-group>
      </lib-menu>

      <lib-menu purpose="selection" accessibleLabel="Language">
        <lib-menu-headline label="Language" />
        <lib-menu-item
          label="English"
          [selected]="language() === 'english'"
          (selectedChange)="selectLanguage('english', $event)"
        />
        <lib-menu-item
          label="French"
          [selected]="language() === 'french'"
          (selectedChange)="selectLanguage('french', $event)"
        />
      </lib-menu>
    </div>
  `,
})
export class MenuSelectionAngular {
  protected readonly density = signal<Density>('comfortable');
  protected readonly spellCheck = signal(true);
  protected readonly language = signal<Language>('english');

  protected selectDensity(value: Density, selected: boolean): void {
    if (selected) this.density.set(value);
  }

  protected selectLanguage(value: Language, selected: boolean): void {
    if (selected) this.language.set(value);
  }
}
