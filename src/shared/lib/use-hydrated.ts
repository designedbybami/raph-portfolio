"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// False on the server and through the hydration pass, true from the first client render after it. Lets a component tell "not decided yet" apart from a client check that genuinely returned false, without a setState-in-effect.
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
