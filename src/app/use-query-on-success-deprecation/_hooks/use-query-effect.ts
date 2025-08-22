// useQueryEffect.ts
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

const markKey = (id: string) => ["__query-effect__", id];

export type UseQueryEffectOptions = {
  /**
   * A unique identifier for this effect.
   *
   * Use a descriptive name (e.g. "users-success" or "users-error").
   * This ensures multiple effects on the same query don't conflict.
   */
  id: string;

  /**
   * Boolean condition that determines when the effect should run.
   *
   * Examples:
   * - `query.isSuccess`
   * - `query.isError`
   * - `query.isFetching && !query.isPreviousData`
   */
  when: boolean;

  /**
   * A timestamp from the query state that changes when new data or errors arrive.
   *
   * Examples:
   * - `query.dataUpdatedAt`
   * - `query.errorUpdatedAt`
   */
  updatedAt: number;

  /**
   * Callback function that will run once when the condition is met
   * and the query state changes.
   */
  fn?: () => void;
};

/**
 * A custom hook to run side-effects based on React Query lifecycle events
 * (success, error, custom conditions).
 *
 * Ensures the effect only runs once per query update using a cache marker.
 *
 * @example
 * ```ts
 * useQueryEffect({
 *   id: 'users-success',
 *   when: query.isSuccess,
 *   updatedAt: query.dataUpdatedAt,
 *   fn: () => toast.success('Users loaded!'),
 * });
 * ```
 */
export function useQueryEffect({
  id,
  when,
  updatedAt,
  fn,
}: UseQueryEffectOptions) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!when || !updatedAt || !fn) return;

    const last = qc.getQueryData<number>(markKey(id));
    if (last === updatedAt) return; // already handled for this update

    qc.setQueryData(markKey(id), updatedAt);
    fn();
  }, [id, when, updatedAt, fn, qc]);
}
