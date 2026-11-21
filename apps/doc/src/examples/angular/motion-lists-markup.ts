import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button, Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

type Message = { id: number; text: string };

// Each message is a presence and a layout: it enters and leaves with the cascade, and the messages around it follow.
@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [Button, Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-start gap-4">
      <udx-button size="small" label="Add two" (click)="addTwo()" />
      <ul class="flex w-full flex-col gap-2">
        @for (message of messages(); track message.id) {
          <li
            udxMotion="cascade reflow"
            class="flex items-center justify-between gap-3 rounded-2xl bg-surface-container-high py-2 pl-4 pr-2"
          >
            <span class="min-w-0 text-body-large text-on-surface">{{ message.text }}</span>
            <udx-button variant="text" size="small" label="Dismiss" (click)="dismiss(message.id)" />
          </li>
        }
      </ul>
    </div>
  `,
})
export class MessageList {
  protected readonly messages = signal<Message[]>([
    { id: 1, text: 'Ada: your build passed' },
    { id: 2, text: 'Lin: review requested' },
  ]);
  private lastId = 2;

  protected addTwo(): void {
    // Added in one change: the two cascade in, above the others.
    const two: Message[] = [
      { id: ++this.lastId, text: 'Mo: deploy finished' },
      { id: ++this.lastId, text: 'Kai: release is ready' },
    ];
    this.messages.update((list) => [...two, ...list]);
  }

  protected dismiss(id: number): void {
    // Angular keeps the message until its exit has played, then removes it.
    this.messages.update((list) => list.filter((message) => message.id !== id));
  }
}
