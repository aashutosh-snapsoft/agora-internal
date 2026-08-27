import { useRef, DependencyList } from "react";
import { isEqual } from "lodash";

function depsAreEqual(prev: DependencyList, next: DependencyList): boolean {
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i++) {
    if (Object.is(prev[i], next[i])) continue;
    if (isEqual(prev[i], next[i])) continue;
    return false;
  }
  return true;
}

export function useDeepMemo<T>(factory: () => T, deps: DependencyList): T {
  const ref = useRef<{ value: T; deps: DependencyList } | undefined>(undefined);
  if (ref.current && depsAreEqual(ref.current.deps, deps)) {
    return ref.current.value;
  }
  ref.current = { value: factory(), deps };
  return ref.current.value;
}
