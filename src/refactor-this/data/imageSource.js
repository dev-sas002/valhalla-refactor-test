/**
 * The image-source seam.
 *
 * Everything above this line in the stack (the gallery service, the hook, the
 * components) knows only this contract. The crippled Express API that ships
 * with the test is one implementation of it; a paginated REST API, a CDN
 * manifest or a fixture file are others, and swapping them is a one-line
 * change in `app.js`.
 *
 * @typedef {Object} Image
 * @property {String} name
 * @property {String} url
 * @property {String} [category]
 *
 * @typedef {Object} ImageSource
 * @property {Number} sliceSize
 *   How many images one call to `fetchSlice` can return. The gallery divides a
 *   UI page into this many-item chunks and fetches them in parallel, so a
 *   source that can serve a whole page in one call needs no code changes - it
 *   just reports a larger `sliceSize` and the gallery fires fewer requests.
 * @property {(category: String, slice: Number, options: {signal?: AbortSignal}) => Promise<Image[]>} fetchSlice
 *   Resolves with at most `sliceSize` images. Resolves with `[]` past the end
 *   of a category. Rejects with an `AbortError` if `signal` is aborted.
 */

/**
 * Shared argument validation, so every implementation rejects the same bad
 * input the same way instead of forwarding it to the network.
 *
 * @throws {TypeError}
 */
export const assertValidSliceQuery = (category, slice) => {
  if (typeof category !== "string" || category.trim() === "") {
    throw new TypeError("category must be a non-empty string");
  }

  if (!Number.isInteger(slice) || slice < 1) {
    throw new TypeError("slice must be an integer >= 1");
  }
};
