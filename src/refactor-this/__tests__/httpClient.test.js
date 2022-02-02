import { createHttpClient, HttpError } from "../data/httpClient";

describe("httpClient", () => {
  test("prefixes the base URL and parses the JSON body", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ name: "nature_1" }],
    });

    const client = createHttpClient({
      baseUrl: "http://api.test",
      fetchImpl,
    });

    await expect(client.getJson("/images?page=1")).resolves.toEqual([
      { name: "nature_1" },
    ]);

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://api.test/images?page=1",
      expect.objectContaining({ headers: { Accept: "application/json" } })
    );
  });

  test("rejects with an HttpError carrying the status", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 503, statusText: "Unavailable" });

    const client = createHttpClient({ baseUrl: "http://api.test", fetchImpl });

    await expect(client.getJson("/images")).rejects.toMatchObject({
      name: "HttpError",
      status: 503,
    });
    await expect(client.getJson("/images")).rejects.toBeInstanceOf(HttpError);
  });

  test("passes the abort signal down to fetch", async () => {
    const controller = new AbortController();
    const fetchImpl = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => [] });

    const client = createHttpClient({ baseUrl: "http://api.test", fetchImpl });
    await client.getJson("/images", { signal: controller.signal });

    expect(fetchImpl.mock.calls[0][1].signal).toBe(controller.signal);
  });
});
