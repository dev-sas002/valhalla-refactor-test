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
 */
export const createHttpClient = ({ baseUrl = BASE_URL, fetchImpl } = {}) => {
  const getJson = async (path, { signal } = {}) => {
    const doFetch = fetchImpl || globalThis.fetch;
    const url = `${baseUrl}${path}`;

    const response = await doFetch(url, {
      signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new HttpError(response.status, response.statusText, url);
    }

    return response.json();
  };

  return { baseUrl, getJson };
};

export default createHttpClient();
