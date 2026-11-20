import { createContext } from 'react';

/**
 * The child of a `Presence` that the motions inside it belong to. Internal: `Presence` and `Motion` share it.
 * @internal
 */
export interface PresenceChildValue {
  /** The key of the child: the Presence keeps a child that left under it until its exit has played. */
  readonly key: string;
  /** False while the child has left and is kept for its exit. */
  readonly present: boolean;
}

/**
 * One motion of a child. It reports whether its exit has played: a child that left is removed once every motion it holds
 * has reported it.
 * @internal
 */
export interface PresenceSlot {
  report(exited: boolean): void;
  detach(): void;
}

/**
 * What a `Presence` gives the motions inside its children. Stable for the lifetime of the Presence.
 * @internal
 */
export interface PresenceRegistryValue {
  attach(key: string): PresenceSlot;
}

export const PresenceChildContext = createContext<PresenceChildValue | null>(null);

export const PresenceRegistryContext = createContext<PresenceRegistryValue | null>(null);
