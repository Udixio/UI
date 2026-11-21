import { useState } from 'react';
import { Button, Motion, Presence } from '@udixio/ui-react';
import '@udixio/motion/presets';

type Message = { id: number; text: string };

let lastId = 2;

// Each message is a presence and a layout: it enters and leaves with the cascade, and the messages around it follow.
export function MessageList() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Ada: your build passed' },
    { id: 2, text: 'Lin: review requested' },
  ]);

  const addTwo = () => {
    // Added in one render: the two cascade in, above the others.
    const two = [
      { id: ++lastId, text: 'Mo: deploy finished' },
      { id: ++lastId, text: 'Kai: release is ready' },
    ];
    setMessages((list) => [...two, ...list]);
  };

  // Presence keeps a removed message on the page until its exit has played, then removes it.
  const dismiss = (id: number) => setMessages((list) => list.filter((message) => message.id !== id));

  return (
    <div className="flex flex-col items-start gap-4">
      <Button size="small" label="Add two" onClick={addTwo} />
      <ul className="flex w-full flex-col gap-2">
        <Presence>
          {messages.map((message) => (
            <Motion
              key={message.id}
              as="li"
              name="cascade reflow"
              className="flex items-center justify-between gap-3 rounded-2xl bg-surface-container-high py-2 pl-4 pr-2"
            >
              <span className="min-w-0 text-body-large text-on-surface">{message.text}</span>
              <Button variant="text" size="small" label="Dismiss" onClick={() => dismiss(message.id)} />
            </Motion>
          ))}
        </Presence>
      </ul>
    </div>
  );
}
