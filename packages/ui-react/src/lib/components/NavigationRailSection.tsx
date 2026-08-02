/**
 * A non-interactive label that groups the `NavigationRailItem`s following it.
 * @status beta
 * @parent NavigationRail
 * @devx
 * - Section labels only render when the rail is extended.
 * @a11y
 * - Renders as plain text with no role or heading semantics; it is announced
 *   like any other static text, not as a group label for assistive tech.
 * @limitations
 * - Purely visual: it does not group its items in an ARIA sense (no
 *   `role="group"`/`aria-labelledby` wiring).
 */
export const NavigationRailSection = ({ label }: { label: string }) => {
  return (
    <div className={' h-9 flex items-center mx-9 mt-3'}>
      <p className={'text-label-large text-on-surface-variant'}>{label}</p>
    </div>
  );
};
