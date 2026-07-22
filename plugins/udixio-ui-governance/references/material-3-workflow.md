# Material 3 component workflow

Material guidance changes. At creation time, browse current official Material 3 sources and record
the pages used. For accessibility semantics, prefer W3C normative sources when they differ in
authority from design guidance.

## Evidence to collect

- anatomy and required sub-elements;
- variants, sizes, density, and shape;
- color roles and state-layer opacity;
- interaction and state transitions;
- motion duration, easing, interruption, and reduced-motion behavior;
- accessibility role, name, state, keyboard model, and touch target;
- responsive, RTL, and content constraints.

Separate normative requirements from local API design decisions. Do not copy an implementation
from another library. Translate the specification into the repository's shared contract.

## Implementation sequence

1. Inspect neighboring mature components and repository standards.
2. Write the framework-agnostic contract and resolved states in core.
3. Add pure behavior and a single shared DOM/Motion controller when imperative effects are needed.
4. Implement and test React as the default source adapter.
5. Synchronize Angular from the resolved contract, not by transliterating JSX.
6. Add direct-source React and Angular examples and MDX documentation.
7. Run the complete quality gates and a parity audit.

Reject invented variants, hollow props, framework types in core, duplicated animations, CSS-only
reimplementations of shared Motion behavior, and documentation examples that cannot compile.
