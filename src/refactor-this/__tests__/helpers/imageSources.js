import { assertValidSliceQuery } from "../../data/imageSource";

/** An AbortError shaped like the one `fetch` rejects with. */
export const abortError = () => {
  const error = new Error("The operation was aborted.");
  error.name = "AbortError";

  return error;
};

/**
 * The images a category holds, as the legacy image-db would produce them.
 *
 * @param {String} category
 * @param {Number} total  how many images the category contains
 */
export const catalogue = (category, total) =>
  Array.from({ length: total }, (_, index) => ({
    category,
    name: `${category}_${index + 1}`,
    url: `http://images.test/${category}/${category}_${index + 1}.jpeg`,
  }));

const sliceOf = (images, slice, sliceSize) =>
  images.slice((slice - 1) * sliceSize, slice * sliceSize);

/**
 * In-memory {@link ImageSource}. Every UI test drives the real components
 * through this instead of mocking modules, which is the point of the seam.
 *
 * @param {Object} options
 * @param {Object} options.counts    category -> number of images it holds
 * @param {Number} [options.sliceSize]
 * @param {Function} [options.onFetch] called with ({category, slice}); return
 *   a promise (or throw) to override the response for that call
 */
export const createInMemoryImageSource = ({
  counts = {},
  sliceSize = 3,
  onFetch,
} = {}) => {
  const calls = [];

  return {
    sliceSize,
    calls,

    async fetchSlice(category, slice, { signal } = {}) {
      assertValidSliceQuery(category, slice);
      calls.push({ category, slice });

      if (signal && signal.aborted) throw abortError();

      if (onFetch) {
        const override = await onFetch({ category, slice });

        if (override !== undefined) return override;
      }

      return sliceOf(
        catalogue(category, counts[category] || 0),
        slice,
        sliceSize
      );
    },
  };
};

/**
 * {@link ImageSource} whose responses the test resolves by hand, so the
 * partially-loaded window between request and response can be asserted on.
 */
export const createDeferredImageSource = ({ sliceSize = 3 } = {}) => {
  const pending = [];

  return {
    sliceSize,
    pending,

    fetchSlice(category, slice, { signal } = {}) {
      return new Promise((resolve, reject) => {
        const entry = { category, slice, resolve, reject };
        const drop = () => {
          const index = pending.indexOf(entry);

          if (index !== -1) pending.splice(index, 1);
        };

        if (signal) {
          signal.addEventListener("abort", () => {
            drop();
            reject(abortError());
          });
        }

        pending.push(entry);
      });
    },

    /** Resolves every outstanding request with `images` and clears the queue. */
    flush(images = []) {
      const queue = pending.splice(0, pending.length);

      queue.forEach((entry) => entry.resolve(images));
    },
  };
};
