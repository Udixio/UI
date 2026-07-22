import type {
  AngularComponentApi,
  ApiMember,
  ComponentApiData,
  ReactComponentApi,
} from '@/types/component-api';
import { ApiFrameworkSelector } from './ApiFrameworkSelector';
import { useActiveComponentApi } from './useActiveComponentApi';

function typeName(member: ApiMember): string {
  return member.type.name;
}

function defaultValue(member: ApiMember): string {
  const value = member.defaultValue;
  return value?.value == null ? '—' : String(value.value);
}

function MemberName({
  member,
  binding,
}: {
  member: ApiMember;
  binding?: 'input' | 'output';
}) {
  const publicName = member.alias ?? member.name;
  const displayedName =
    binding === 'input'
      ? `[${publicName}]`
      : binding === 'output'
        ? `(${publicName})`
        : member.name;
  const hasDistinctPropertyName = binding && publicName !== member.name;

  return (
    <>
      <code className="rounded bg-black/5 px-1.5 py-0.5">{displayedName}</code>
      {hasDistinctPropertyName && (
        <span className="mt-1 block text-xs text-on-surface-variant">
          Property: <code>{member.name}</code>
        </span>
      )}
    </>
  );
}

function InputTable({
  caption,
  members,
  binding,
}: {
  caption: string;
  members: Record<string, ApiMember>;
  binding?: 'input';
}) {
  const rows = Object.values(members);

  return (
    <div className="overflow-x-auto rounded-3xl bg-surface-container">
      <table className="w-full min-w-[760px] border-collapse text-left">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-outline-variant text-title-small text-on-surface-variant">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Required</th>
            <th className="px-4 py-3">Default</th>
            <th className="px-4 py-3">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant">
          {rows.map((member) => (
            <tr key={member.name} className="align-top">
              <td className="px-4 py-3 whitespace-nowrap">
                <MemberName member={member} binding={binding} />
              </td>
              <td className="px-4 py-3">
                <code className="rounded bg-black/5 px-1.5 py-0.5">
                  {typeName(member)}
                </code>
              </td>
              <td className="px-4 py-3">{member.required ? 'Yes' : 'No'}</td>
              <td className="px-4 py-3">
                <code className="rounded bg-black/5 px-1.5 py-0.5">
                  {defaultValue(member)}
                </code>
              </td>
              <td className="max-w-[36rem] px-4 py-3 text-sm leading-relaxed">
                {member.description || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OutputTable({ outputs }: { outputs: Record<string, ApiMember> }) {
  return (
    <div className="overflow-x-auto rounded-3xl bg-surface-container">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <caption className="sr-only">Angular outputs</caption>
        <thead className="border-b border-outline-variant text-title-small text-on-surface-variant">
          <tr>
            <th className="px-4 py-3">Output</th>
            <th className="px-4 py-3">Event type</th>
            <th className="px-4 py-3">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant">
          {Object.values(outputs).map((output) => (
            <tr key={output.name} className="align-top">
              <td className="px-4 py-3 whitespace-nowrap">
                <MemberName member={output} binding="output" />
              </td>
              <td className="px-4 py-3">
                <code className="rounded bg-black/5 px-1.5 py-0.5">
                  {typeName(output)}
                </code>
              </td>
              <td className="max-w-[36rem] px-4 py-3 text-sm leading-relaxed">
                {output.description || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContentTable({
  content,
}: {
  content: AngularComponentApi['content'];
}) {
  if (!content || Object.keys(content).length === 0) return null;

  return (
    <section aria-labelledby="angular-content-title">
      <h2 id="angular-content-title" className="mb-4 text-headline-medium">
        Content projection
      </h2>
      <div className="overflow-x-auto rounded-3xl bg-surface-container">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <caption className="sr-only">
            Angular content projection slots
          </caption>
          <thead className="border-b border-outline-variant text-title-small text-on-surface-variant">
            <tr>
              <th className="px-4 py-3">Slot</th>
              <th className="px-4 py-3">Selector</th>
              <th className="px-4 py-3">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {Object.values(content).map((slot) => (
              <tr key={slot.name} className="align-top">
                <td className="px-4 py-3">
                  <code className="rounded bg-black/5 px-1.5 py-0.5">
                    {slot.name}
                  </code>
                </td>
                <td className="px-4 py-3">
                  <code className="rounded bg-black/5 px-1.5 py-0.5">
                    {slot.selector}
                  </code>
                </td>
                <td className="max-w-[36rem] px-4 py-3 text-sm leading-relaxed">
                  {slot.description || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EmptyApi({ children }: { children: string }) {
  return (
    <p className="rounded-3xl bg-surface-container p-6 text-on-surface-variant">
      {children}
    </p>
  );
}

export function ComponentApiReference({ api }: { api: ComponentApiData }) {
  const { activeFramework, activeApi, availableFrameworks } =
    useActiveComponentApi(api);

  if (activeFramework === 'react') {
    const reactApi = activeApi as ReactComponentApi;
    return (
      <div className="mt-10 space-y-8">
        <ApiFrameworkSelector
          activeFramework={activeFramework}
          frameworks={availableFrameworks}
        />
        <section aria-labelledby="react-props-title">
          <h2 id="react-props-title" className="mb-4 text-headline-medium">
            Props
          </h2>
          {Object.keys(reactApi.props).length > 0 ? (
            <InputTable caption="React props" members={reactApi.props} />
          ) : (
            <EmptyApi>This component exposes no React props.</EmptyApi>
          )}
        </section>
      </div>
    );
  }

  const angularApi = activeApi as AngularComponentApi;
  return (
    <div className="mt-10 space-y-8">
      <ApiFrameworkSelector
        activeFramework={activeFramework}
        frameworks={availableFrameworks}
      />
      <section aria-labelledby="angular-inputs-title">
        <h2 id="angular-inputs-title" className="mb-4 text-headline-medium">
          Inputs
        </h2>
        {Object.keys(angularApi.inputs).length > 0 ? (
          <InputTable
            caption="Angular inputs"
            members={angularApi.inputs}
            binding="input"
          />
        ) : (
          <EmptyApi>This component exposes no Angular inputs.</EmptyApi>
        )}
      </section>
      <section aria-labelledby="angular-outputs-title">
        <h2 id="angular-outputs-title" className="mb-4 text-headline-medium">
          Outputs
        </h2>
        {Object.keys(angularApi.outputs).length > 0 ? (
          <OutputTable outputs={angularApi.outputs} />
        ) : (
          <EmptyApi>This component exposes no Angular outputs.</EmptyApi>
        )}
      </section>
      <ContentTable content={angularApi.content} />
    </div>
  );
}
