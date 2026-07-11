import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { useFavorites, useToggleFavorite, favoriteKeys } from "./favorites";
import { createQueryWrapper } from "../test/utils";
import { server } from "../test/msw/server";
import { bevFixture } from "../test/fixtures";

describe("useToggleFavorite", () => {
  it("optimistically adds the car before the server responds", async () => {
    const { client, Wrapper } = createQueryWrapper();
    const favorites = renderHook(() => useFavorites(), { wrapper: Wrapper });
    await waitFor(() => expect(favorites.result.current.isSuccess).toBe(true));
    expect(favorites.result.current.data).toEqual([]);

    // Stateful backend: GET reflects the set; POST is delayed so any state we
    // observe mid-flight is the optimistic update, not the server response.
    const favs = new Set<string>();
    server.use(
      http.get("*/api/favorites", () =>
        HttpResponse.json({ carIds: [...favs] }),
      ),
      http.post("*/api/favorites", async ({ request }) => {
        await delay(100);
        const body = (await request.json()) as { carId: string };
        favs.add(body.carId);
        return HttpResponse.json({ carIds: [...favs] });
      }),
    );

    const toggle = renderHook(() => useToggleFavorite(), { wrapper: Wrapper });
    act(() => {
      toggle.result.current.mutate({ carId: bevFixture.id, isFavorite: false });
    });

    await waitFor(() =>
      expect(client.getQueryData<string[]>(favoriteKeys.all)).toContain(
        bevFixture.id,
      ),
    );
    // The request is still in flight, so the id is from the optimistic update.
    expect(toggle.result.current.isPending).toBe(true);

    await waitFor(() => expect(toggle.result.current.isSuccess).toBe(true));
    expect(client.getQueryData<string[]>(favoriteKeys.all)).toContain(
      bevFixture.id,
    );
  });

  it("rolls back the optimistic add when the request fails", async () => {
    const { client, Wrapper } = createQueryWrapper();
    const favorites = renderHook(() => useFavorites(), { wrapper: Wrapper });
    await waitFor(() => expect(favorites.result.current.isSuccess).toBe(true));

    server.use(
      http.post("*/api/favorites", () =>
        HttpResponse.json({ error: "boom" }, { status: 500 }),
      ),
    );

    const toggle = renderHook(() => useToggleFavorite(), { wrapper: Wrapper });
    act(() => {
      toggle.result.current.mutate({ carId: bevFixture.id, isFavorite: false });
    });

    await waitFor(() => expect(toggle.result.current.isError).toBe(true));
    expect(client.getQueryData<string[]>(favoriteKeys.all)).toEqual([]);
  });
});
