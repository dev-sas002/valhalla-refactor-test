import { createHttpClient, HttpError, TimeoutError } from "../data/httpClient";
import { isAbortError } from "../data/galleryService";

const abortError = () => {
  const error = new Error("The operation was aborted.");
  error.name = "AbortError";

  return error;
};

/**
 * A fetch that never answers on its own. Like the real one, it rejects with
 * an AbortError as soon as its signal is (or already was) aborted.
 */
const hangingFetch = () =>
  jest.fn(
    (_url, { signal }) =>
      new Promise((_resolve, reject) => {
        if (signal.aborted) reject(abortError());
        signal.addEventListener("abort", () => reject(abortError()));
      })
  );

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

  test("aborts the request when the caller's signal aborts", async () => {
    const controller = new AbortController();
    const fetchImpl = hangingFetch();
    const client = createHttpClient({ baseUrl: "http://api.test", fetchImpl });

    const request = client.getJson("/images", { signal: controller.signal });
    controller.abort();

    const error = await request.catch((e) => e);
    expect(isAbortError(error)).toBe(true);
  });

  test("hands fetch an aborted signal when the caller already gave up", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchImpl = hangingFetch();
    const client = createHttpClient({ baseUrl: "http://api.test", fetchImpl });

    const error = await client
      .getJson("/images", { signal: controller.signal })
      .catch((e) => e);

    expect(isAbortError(error)).toBe(true);
    expect(fetchImpl.mock.calls[0][1].signal.aborted).toBe(true);
  });

  describe("deadline", () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    test("gives up on a hung request with a TimeoutError", async () => {
      const client = createHttpClient({
        baseUrl: "http://api.test",
        fetchImpl: hangingFetch(),
        timeoutMs: 5000,
      });

      const request = client.getJson("/images").catch((e) => e);
      jest.advanceTimersByTime(5000);
      const error = await request;

      expect(error).toBeInstanceOf(TimeoutError);
      expect(error.message).toBe(
        "GET http://api.test/images timed out after 5000 ms"
      );
      // A timeout must surface to the user, not be swallowed like a
      // deliberate cancellation.
      expect(isAbortError(error)).toBe(false);
    });

    test("clears the timer once the response arrives", async () => {
      const fetchImpl = jest
        .fn()
        .mockResolvedValue({ ok: true, json: async () => [] });
      const client = createHttpClient({
        baseUrl: "http://api.test",
        fetchImpl,
      });

      await client.getJson("/images");

      expect(jest.getTimerCount()).toBe(0);
    });
  });
});
