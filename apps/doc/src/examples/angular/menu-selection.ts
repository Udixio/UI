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
      <udx-menu accessibleLabel="Editor preferences">
        <udx-menu-group label="Density">
          <udx-menu-item
            label="Comfortable"
            selectionType="single"
            [selected]="density() === 'comfortable'"
            (selectedChange)="selectDensity('comfortable', $event)"
          />
          <udx-menu-item
            label="Compact"
            selectionType="single"
            [selected]="density() === 'compact'"
            (selectedChange)="selectDensity('compact', $event)"
          />
        </udx-menu-group>
        <udx-menu-group label="Tools">
          <udx-menu-item
            label="Spell checking"
            selectionType="multiple"
            [selected]="spellCheck()"
            (selectedChange)="spellCheck.set($event)"
          />
          <udx-menu-item
            label="Grammar suggestions"
            selectionType="multiple"
            defaultSelected
          />
        </udx-menu-group>
      </udx-menu>

      <udx-menu purpose="selection" accessibleLabel="Language">
        <udx-menu-headline label="Language" />
        <udx-menu-item
          label="English"
          [selected]="language() === 'english'"
          (selectedChange)="selectLanguage('english', $event)"
        />
        <udx-menu-item
          label="French"
          [selected]="language() === 'french'"
          (selectedChange)="selectLanguage('french', $event)"
        />
      </udx-menu>
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
