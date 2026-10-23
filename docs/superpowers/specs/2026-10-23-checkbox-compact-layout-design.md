# Checkbox compact layout design

## Intent

Keep the Checkbox's current visual appearance and current 40px interaction/state
surface, while preventing that surface from reserving 40px in normal layout flow.
The visible 16px box remains the component's layout footprint.

## Goals

- Keep the existing box, icon, colors, states, and 40px state layer unchanged.
- Make the root layout footprint `size-4`.
- Center the native input and state layer as absolute `size-10` surfaces.
- Keep the focus indicator around the enlarged interaction surface.
- Preserve consumer-controlled margins without internal negative margins.
- Keep the same behavior in Core, React, Angular, and Svelte.

## Non-goals

- No public `edgeAligned` prop.
- No change from the current 40px target to 48px.
- No change to checked, indeterminate, disabled, invalid, form, or event behavior.

## Approach

Reuse the Button/IconButton pattern at the style/DOM level: the semantic input
and state layer overflow the compact root through absolute positioning. The
focus ring is painted by the root's existing `:has(:focus-visible)` mechanism
on a 40px pseudo-surface, so no new public element-class contract is needed.

## Validation

Add a shared style assertion plus equivalent React, Angular, and Svelte DOM
assertions for the compact root, centered 40px input/state layer, preserved
visual box, and enlarged focus surface. Run the component adapter tests and
the proportional package type/build gates.
