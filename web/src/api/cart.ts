import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

export const cartKeys = {
  all: ["cart"] as const,
};

/** GET /api/cart — the user's shortlist car ids. */
export function useCart() {
  return useQuery({
    queryKey: cartKeys.all,
    queryFn: async () => (await api<{ carIds: string[] }>("/api/cart")).carIds,
  });
}

export interface CartToggle {
  carId: string;
  /** The car's CURRENT cart state; the mutation flips it. */
  inCart: boolean;
}

/**
 * Toggle a cart/shortlist entry with an optimistic cache update.
 * `inCart: true` → DELETE (remove); `false` → POST (add).
 */
export function useToggleCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ carId, inCart }: CartToggle) =>
      inCart
        ? api<{ carIds: string[] }>(`/api/cart/${encodeURIComponent(carId)}`, {
            method: "DELETE",
          })
        : api<{ carIds: string[] }>("/api/cart", {
            method: "POST",
            json: { carId },
          }),
    onMutate: async ({ carId, inCart }) => {
      await qc.cancelQueries({ queryKey: cartKeys.all });
      const previous = qc.getQueryData<string[]>(cartKeys.all) ?? [];
      const next = inCart
        ? previous.filter((id) => id !== carId)
        : [...new Set([...previous, carId])];
      qc.setQueryData<string[]>(cartKeys.all, next);
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(cartKeys.all, ctx.previous);
    },
    onSuccess: (data) => {
      qc.setQueryData<string[]>(cartKeys.all, data.carIds);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

/** URL for the signed-in cart export download (used as an anchor href). */
export function exportCartUrl(format: "csv" | "pdf"): string {
  return `/api/export/cart?format=${format}`;
}

/**
 * URL for exporting an explicit set of vehicle ids (public, no auth) — used
 * when the compare view is an `?ids=` deep-link rather than the signed-in cart.
 */
export function exportCompareUrl(ids: string[], format: "csv" | "pdf"): string {
  const idsParam = ids.map(encodeURIComponent).join(",");
  return `/api/export/compare?ids=${idsParam}&format=${format}`;
}
