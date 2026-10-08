import { ChangeDetectionStrategy, Component } from '@angular/core';
import { defineConfig } from '@udixio/tailwind';
import { Button, ThemeProvider } from '@udixio/ui-angular';

@Component({
  selector: 'theme-provider-angular-example',
  standalone: true,
  imports: [ThemeProvider, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-theme-provider [config]="themeConfig">
      <div class="dynamic">
        <udx-button label="Themed action" />
      </div>
    </udx-theme-provider>
  `,
})
export class ThemeProviderAngularExample {
  protected readonly themeConfig = defineConfig({
    sourceColor: '#6750A4',
    dynamicSelector: '.dynamic',
  });
}
