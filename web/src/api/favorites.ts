import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

export const favoriteKeys = {
  all: ["favorites"] as const,
};

/** GET /api/favorites — the user's favorited car ids. */
export function useFavorites() {
  return useQuery({
    queryKey: favoriteKeys.all,
    queryFn: async () =>
      (await api<{ carIds: string[] }>("/api/favorites")).carIds,
  });
}

export interface FavoriteToggle {
  carId: string;
  /** The car's CURRENT favorite state; the mutation flips it. */
  isFavorite: boolean;
}

/**
 * Toggle a favorite with an optimistic cache update.
 * `isFavorite: true`  → DELETE (remove); `false` → POST (add).
 */
export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ carId, isFavorite }: FavoriteToggle) =>
      isFavorite
        ? api<{ carIds: string[] }>(
            `/api/favorites/${encodeURIComponent(carId)}`,
            { method: "DELETE" },
          )
        : api<{ carIds: string[] }>("/api/favorites", {
            method: "POST",
            json: { carId },
          }),
    onMutate: async ({ carId, isFavorite }) => {
      await qc.cancelQueries({ queryKey: favoriteKeys.all });
      const previous = qc.getQueryData<string[]>(favoriteKeys.all) ?? [];
      const next = isFavorite
        ? previous.filter((id) => id !== carId)
        : [...new Set([...previous, carId])];
      qc.setQueryData<string[]>(favoriteKeys.all, next);
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(favoriteKeys.all, ctx.previous);
    },
    onSuccess: (data) => {
      qc.setQueryData<string[]>(favoriteKeys.all, data.carIds);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: favoriteKeys.all });
    },
  });
}
