import { BASE_URL } from "../constants/url";

/** Thrown when the server answers with a non-2xx status. */
export class HttpError extends Error {
  constructor(status, statusText, url) {
    super(`GET ${url} failed with status ${status} ${statusText}`.trim());
    this.name = "HttpError";
    this.status = status;
    this.url = url;
  }
}

/** Thrown when a request outlives its deadline. */
export class TimeoutError extends Error {
  constructor(url, timeoutMs) {
    super(`GET ${url} timed out after ${timeoutMs} ms`);
    this.name = "TimeoutError";
    this.url = url;
  }
}

/**
 * The legacy API sleeps 3 seconds by design, so a response five times later
 * than that is a hung connection, not a slow one. Without a deadline the
 * skeleton would stay up forever and the retry button would never appear.
 */
export const DEFAULT_TIMEOUT_MS = 15000;

/**
 * Minimal JSON-over-HTTP client.
 *
 * The app issues exactly one kind of call - a GET that returns JSON - so it
 * uses `fetch` directly instead of a client library. That keeps ~49 KB of
 * axios out of the bundle and, more importantly, gives us native
 * `AbortSignal` support, which the gallery relies on to cancel requests the
 * user has navigated away from.
 *
 * @param {Object}   [options]
 * @param {String}   [options.baseUrl]   prefixed to every path
 * @param {Function} [options.fetchImpl] injected for tests
 * @param {Number}   [options.timeoutMs] per-request deadline
 */
export const createHttpClient = ({
  baseUrl = BASE_URL,
  fetchImpl,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) => {
  const getJson = async (path, { signal } = {}) => {
    const doFetch = fetchImpl || globalThis.fetch;
    const url = `${baseUrl}${path}`;

    // One controller carries both reasons to stop: the caller's signal (the
    // user left the category) and our own deadline. They are told apart
    // afterwards, because only the deadline is an error worth showing.
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    const forwardAbort = () => controller.abort();

    if (signal && signal.aborted) controller.abort();
    else if (signal) signal.addEventListener("abort", forwardAbort);

    try {
      const response = await doFetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new HttpError(response.status, response.statusText, url);
      }

      return await response.json();
    } catch (error) {
      if (timedOut) throw new TimeoutError(url, timeoutMs);
      throw error;
    } finally {
      clearTimeout(timer);
      if (signal) signal.removeEventListener("abort", forwardAbort);
    }
  };

  return { baseUrl, getJson };
};

export default createHttpClient();
