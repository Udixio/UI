import { useId, useState, type ReactNode } from 'react';
import { Icon, Motion } from '@udixio/ui-react';
import { iKeyboardArrowDown } from '@udixio/icons-rounded-400/keyboard_arrow_down';
import '@udixio/motion/presets';

const QUESTIONS = [
  { question: 'Can I return an order?', answer: 'Yes, within 30 days.' },
  { question: 'How long does delivery take?', answer: 'Two to four working days.' },
  { question: 'Do you ship abroad?', answer: 'Across the European Union.' },
];

type AnswerProps = { id: string; labelledBy: string; open: boolean; children: ReactNode };

// The answer is always rendered, so it is in the server HTML and a search engine reads it.
// `present` plays its entry and its exit, and sets `hidden` once the exit has played, from the server render on.
function Answer({ id, labelledBy, open, children }: AnswerProps) {
  return (
    <Motion
      as="div"
      name="fade"
      present={open}
      id={id}
      role="region"
      aria-labelledby={labelledBy}
      className="px-4 pb-4 text-body-medium text-on-surface-variant"
    >
      {children}
    </Motion>
  );
}

export function MotionRecipeAccordionReact() {
  // One answer open at a time: opening one closes the other.
  const [expanded, setExpanded] = useState<number | null>(null);
  const id = useId();
  const toggle = (index: number) => setExpanded((current) => (current === index ? null : index));

  return (
    // `reflow` on each item: the items below glide to their new place as an answer opens or closes.
    <ul className="flex min-h-70 w-full max-w-96 flex-col gap-2 max-sm:min-h-80">
      {QUESTIONS.map(({ question, answer }, index) => {
        const open = expanded === index;
        return (
          <Motion key={question} as="li" name="reflow" className="rounded-2xl bg-surface-container">
            <h3>
              <button
                type="button"
                id={`${id}-q${index}`}
                aria-expanded={open}
                aria-controls={`${id}-a${index}`}
                onClick={() => toggle(index)}
                className="flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 text-left text-title-small text-on-surface focus-visible:outline-2 focus-visible:outline-primary"
              >
                {question}
                <span aria-hidden="true" className={`flex transition-[rotate] duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}>
                  <Icon icon={iKeyboardArrowDown} />
                </span>
              </button>
            </h3>
            <Answer id={`${id}-a${index}`} labelledBy={`${id}-q${index}`} open={open}>
              {answer}
            </Answer>
          </Motion>
        );
      })}
    </ul>
  );
}
