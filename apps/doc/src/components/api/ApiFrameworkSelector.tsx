import { classNames } from '@udixio/core';
import {
  setPreferredExampleFramework,
  type ExampleFramework,
} from '@/stores/exampleFrameworkStore';

const LABELS: Record<ExampleFramework, string> = {
  react: 'React',
  angular: 'Angular',
};

export function ApiFrameworkSelector({
  activeFramework,
  frameworks,
}: {
  activeFramework: ExampleFramework;
  frameworks: ExampleFramework[];
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-1"
      aria-label="API framework"
    >
      {frameworks.map((framework) => (
        <button
          key={framework}
          type="button"
          className={classNames(
            'rounded-full px-4 py-2 text-label-large transition-colors',
            framework === activeFramework
              ? 'bg-secondary-container text-on-secondary-container'
              : 'text-on-surface-variant hover:bg-surface-container-highest',
          )}
          aria-pressed={framework === activeFramework}
          onClick={() => setPreferredExampleFramework(framework)}
        >
          {LABELS[framework]}
        </button>
      ))}
    </div>
  );
}
