import { IMAGES_PER_PAGE } from "../constants/general";

const isAbortError = (error) => error && error.name === "AbortError";

/**
 * Turns an {@link ImageSource} that can only answer in small slices into a
 * pageable gallery, and hides the cost of the slow upstream from the UI.
 *
 * Four things happen here, and they are the substance of the exercise:
 *
 * 1. **Batching in parallel.** A UI page of 9 needs three 3-item slices. They
 *    are fetched with `Promise.all`, so three 3-second requests overlap into
 *    one ~3-second wait instead of stacking up to 9 seconds.
 * 2. **Caching.** A page that has been assembled once is kept, so going back
 *    is instant rather than another 3-second wait.
 * 3. **Request de-duplication.** A page already in flight is shared rather
 *    than fetched twice, so a prefetch that the user then navigates to does
 *    not double the load on the upstream.
 * 4. **Cancellation.** Every in-flight page owns an `AbortController`, so
 *    requests for a category the user has navigated away from are actually
 *    aborted instead of merely ignored.
 *
 * The service is deliberately framework-free: it is plain JavaScript with no
 * React import, which is why it can be tested directly.
 *
 * @param {Object}      options
 * @param {ImageSource} options.source
 * @param {Number}      [options.pageSize] images per UI page
 */
export const createGalleryService = ({
  source,
  pageSize = IMAGES_PER_PAGE,
}) => {
  if (!source || typeof source.fetchSlice !== "function") {
    throw new TypeError("createGalleryService requires an ImageSource");
  }

  const sliceSize = source.sliceSize || pageSize;
  const slicesPerPage = Math.max(1, Math.ceil(pageSize / sliceSize));

  /** @type {Map<String, {images: Image[], isLastPage: Boolean}>} */
  const cache = new Map();
  /** @type {Map<String, {promise: Promise, controller: AbortController, category: String, page: Number}>} */
  const inFlight = new Map();

  const keyOf = (category, page) => `${category}:${page}`;

  /**
   * The upstream slice numbers backing a UI page. With 3 items per slice and
   * 9 per page, UI page n covers slices 3n-2, 3n-1 and 3n.
   *
   * @param {Number} page 1-based UI page
   * @returns {Number[]}
   */
  const slicesForPage = (page) => {
    const first = (page - 1) * slicesPerPage + 1;

    return Array.from({ length: slicesPerPage }, (_, i) => first + i);
  };

  const startLoad = (category, page) => {
    const key = keyOf(category, page);
    const controller = new AbortController();

    const promise = Promise.all(
      slicesForPage(page).map((slice) =>
        source.fetchSlice(category, slice, { signal: controller.signal })
      )
    )
      .then((slices) => {
        const images = slices.flat();
        // A short page means the category is exhausted. Checking only the
        // final slice missed a partially filled tail and let the user page
        // forward into an empty grid.
        const entry = { images, isLastPage: images.length < pageSize };

        cache.set(key, entry);

        return entry;
      })
      .finally(() => {
        const current = inFlight.get(key);

        if (current && current.promise === promise) inFlight.delete(key);
      });

    inFlight.set(key, { promise, controller, category, page });

    return promise;
  };

  return {
    pageSize,
    slicesPerPage,
    slicesForPage,

    /**
     * Resolves with the images for a UI page, from cache when possible.
     *
     * @returns {Promise<{images: Image[], isLastPage: Boolean}>}
     */
    getPage(category, page) {
      const key = keyOf(category, page);
      const cached = cache.get(key);

      if (cached) return Promise.resolve(cached);

      const pending = inFlight.get(key);

      if (pending) return pending.promise;

      return startLoad(category, page);
    },

    /**
     * Synchronously returns an already-assembled page, or `undefined`.
     * Lets the UI render a cached page without a loading frame.
     */
    peekPage(category, page) {
      return cache.get(keyOf(category, page));
    },

    /**
     * Warms the cache for a page the user has not asked for yet.
     *
     * It never rejects: a failed prefetch must not surface as a failure of the
     * page the user is actually looking at, and `getPage` will retry. It does
     * resolve with the page, so the caller can learn - for free, while the
     * user reads the current page - whether there is anything after it.
     *
     * @returns {Promise<{images: Image[], isLastPage: Boolean}|undefined>}
     */
    prefetchPage(category, page) {
      if (page < 1) return Promise.resolve(undefined);

      return this.getPage(category, page).catch(() => undefined);
    },

    /**
     * Aborts in-flight page loads the user no longer needs.
     *
     * @param {(entry: {category: String, page: Number}) => Boolean} shouldCancel
     */
    cancelPending(shouldCancel) {
      inFlight.forEach((entry, key) => {
        if (!shouldCancel(entry)) return;

        entry.controller.abort();
        inFlight.delete(key);
      });
    },

    /** Drops every cached page. Exposed for tests and for a manual refresh. */
    clear() {
      cache.clear();
    },
  };
};

export { isAbortError };
