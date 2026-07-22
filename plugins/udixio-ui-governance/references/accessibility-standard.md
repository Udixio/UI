# Accessibility standard

Use current primary sources for normative claims: W3C WCAG, WAI-ARIA, the ARIA Authoring Practices
Guide, framework documentation, and the current Material 3 specification. Cite the exact source
when a claim affects the public contract.

## Audit dimensions

- Native semantic element before ARIA emulation.
- Accessible name, description, role, value, state, and error relationships.
- Complete keyboard model, focus order, focus-visible treatment, and focus restoration.
- Controlled and uncontrolled state announcements without duplicate events.
- Disabled versus `aria-disabled` behavior, including links made inert.
- Pointer target size, coarse pointer behavior, hover independence, and cancellation.
- Contrast in every state and theme; do not infer contrast from token names.
- Reduced-motion handling that preserves meaning and completion.
- High contrast/forced colors, zoom/reflow, text spacing, RTL, and localization where relevant.
- Screen-reader-safe loading, progress, validation, and live-region behavior.
- Equivalent semantics and interaction in React and Angular.

Automated checks are evidence, not proof. Inspect rendered DOM and interaction logic, and add
behavior tests for regressions. Do not add ARIA when a native element already supplies the correct
semantics.
