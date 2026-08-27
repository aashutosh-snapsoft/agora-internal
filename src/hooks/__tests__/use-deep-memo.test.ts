/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { useDeepMemo } from "../use-deep-memo";

describe("useDeepMemo", () => {
  it("returns computed value on first render", () => {
    const { result } = renderHook(() => useDeepMemo(() => ({ a: 1 }), [1, 2]));
    expect(result.current).toEqual({ a: 1 });
  });

  it("returns same reference when deps have not changed", () => {
    const { result, rerender } = renderHook(() =>
      useDeepMemo(() => ({ a: 1 }), [1, 2])
    );
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it("returns new reference when deps actually change", () => {
    let dep = 1;
    const { result, rerender } = renderHook(() =>
      useDeepMemo(() => ({ value: dep }), [dep])
    );
    const first = result.current;

    dep = 2;
    rerender();

    expect(result.current).not.toBe(first);
    expect(result.current).toEqual({ value: 2 });
  });

  it("handles deps with circular references without throwing", () => {
    const circular: Record<string, unknown> = { a: 1 };
    circular.self = circular;

    const { result, rerender } = renderHook(() =>
      useDeepMemo(() => ({ computed: true }), [circular])
    );
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it("returns same reference when object deps are structurally equal but referentially different", () => {
    let dep = { x: 1 };
    const { result, rerender } = renderHook(() =>
      useDeepMemo(() => ({ computed: true }), [dep])
    );
    const first = result.current;

    dep = { x: 1 }; // new reference, same structure
    rerender();

    expect(result.current).toBe(first);
  });

  it("uses referential equality as fast path (avoids stringify)", () => {
    const stableRef = { huge: "object" };
    const { result, rerender } = renderHook(() =>
      useDeepMemo(() => ({ computed: true }), [stableRef])
    );
    const first = result.current;

    // Same reference — should skip stringify entirely
    rerender();
    expect(result.current).toBe(first);
  });

  it("compares function-valued deps by reference via isEqual", () => {
    const fn1 = () => "a";
    const fn2 = () => "a";

    let dep = fn1;
    const { result, rerender } = renderHook(() =>
      useDeepMemo(() => ({ computed: true }), [dep])
    );
    const first = result.current;

    // Same reference — should return same memo
    rerender();
    expect(result.current).toBe(first);

    // Different function reference — should recompute
    dep = fn2;
    rerender();
    expect(result.current).not.toBe(first);
    expect(result.current).toEqual({ computed: true });
  });
});
