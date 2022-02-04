import { API_SLICE_SIZE } from "../constants/general";
import defaultHttpClient from "./httpClient";
import { assertValidSliceQuery } from "./imageSource";

/**
 * {@link ImageSource} backed by the legacy Express API in
 * `src/do-not-refactor`, which answers with at most 3 items per request and
 * sleeps for 3 seconds first.
 *
 * @param {Object} [options]
 * @param {Object} [options.httpClient]
 * @returns {ImageSource}
 */
export const createLegacyImageSource = ({
  httpClient = defaultHttpClient,
} = {}) => ({
  sliceSize: API_SLICE_SIZE,

  async fetchSlice(category, slice, { signal } = {}) {
    assertValidSliceQuery(category, slice);

    const query = new URLSearchParams({ category, page: String(slice) });
    const images = await httpClient.getJson(`/images?${query}`, { signal });

    return Array.isArray(images) ? images : [];
  },
});

export default createLegacyImageSource;
