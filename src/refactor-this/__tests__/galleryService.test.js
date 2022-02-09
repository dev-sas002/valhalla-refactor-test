import { createGalleryService } from "../data/galleryService";
import {
  catalogue,
  createDeferredImageSource,
  createInMemoryImageSource,
} from "./helpers/imageSources";

const galleryOver = (counts, extra) =>
  createGalleryService({
    source: createInMemoryImageSource({ counts, ...extra }),
  });

describe("createGalleryService", () => {
  test("refuses to be built without an image source", () => {
    expect(() => createGalleryService({})).toThrow(TypeError);
  });

  test("maps a UI page onto the upstream slices backing it", () => {
    const gallery = galleryOver({ nature: 0 });

    expect(gallery.slicesPerPage).toBe(3);
    expect(gallery.slicesForPage(1)).toEqual([1, 2, 3]);
    expect(gallery.slicesForPage(2)).toEqual([4, 5, 6]);
    expect(gallery.slicesForPage(3)).toEqual([7, 8, 9]);
  });

  test("fires every slice of a page in parallel, not one after another", async () => {
    const source = createDeferredImageSource();
    const gallery = createGalleryService({ source });

    const pending = gallery.getPage("nature", 1);

    // All three requests are outstanding before any of them has answered.
    expect(source.pending).toHaveLength(3);
    expect(source.pending.map((entry) => entry.slice)).toEqual([1, 2, 3]);

    source.flush([]);
    await pending;
  });

  test("assembles the slices into one page, in order", async () => {
    const gallery = galleryOver({ nature: 21 });
    const { images, isLastPage } = await gallery.getPage("nature", 1);

    expect(images).toEqual(catalogue("nature", 21).slice(0, 9));
    expect(isLastPage).toBe(false);
  });

  test("marks a short page as the last one", async () => {
    // 21 images: page 3 holds the remaining 3.
    const gallery = galleryOver({ nature: 21 });

    await expect(gallery.getPage("nature", 2)).resolves.toMatchObject({
      isLastPage: false,
    });

    const third = await gallery.getPage("nature", 3);
    expect(third.images).toHaveLength(3);
    expect(third.isLastPage).toBe(true);
  });

  test("marks a partially filled tail slice as the last page", async () => {
    // 23 images: page 3 holds 5, spread over a full slice and a partial one.
    const gallery = galleryOver({ architecture: 23 });
    const third = await gallery.getPage("architecture", 3);

    expect(third.images).toHaveLength(5);
    expect(third.isLastPage).toBe(true);
  });

  test("serves a page it has already assembled from cache", async () => {
    const source = createInMemoryImageSource({ counts: { nature: 21 } });
    const gallery = createGalleryService({ source });

    const first = await gallery.getPage("nature", 1);
    expect(source.calls).toHaveLength(3);

    const second = await gallery.getPage("nature", 1);
    expect(source.calls).toHaveLength(3);
    expect(second).toBe(first);
  });

  test("peekPage exposes a cached page synchronously", async () => {
    const gallery = galleryOver({ nature: 21 });

    expect(gallery.peekPage("nature", 1)).toBeUndefined();
    await gallery.getPage("nature", 1);
    expect(gallery.peekPage("nature", 1).images).toHaveLength(9);
  });

  test("shares one in-flight request between concurrent callers", async () => {
    const source = createInMemoryImageSource({ counts: { nature: 21 } });
    const gallery = createGalleryService({ source });

    const [a, b] = await Promise.all([
      gallery.getPage("nature", 1),
      gallery.getPage("nature", 1),
    ]);

    expect(source.calls).toHaveLength(3);
    expect(a).toBe(b);
  });

  test("clear() drops the cache so the next read refetches", async () => {
    const source = createInMemoryImageSource({ counts: { nature: 21 } });
    const gallery = createGalleryService({ source });

    await gallery.getPage("nature", 1);
    gallery.clear();
    await gallery.getPage("nature", 1);

    expect(source.calls).toHaveLength(6);
  });

  describe("prefetch", () => {
    test("warms the cache for a page nobody has asked for yet", async () => {
      const source = createInMemoryImageSource({ counts: { nature: 21 } });
      const gallery = createGalleryService({ source });

      gallery.prefetchPage("nature", 2);
      await gallery.getPage("nature", 2);

      expect(source.calls).toHaveLength(3);
      expect(gallery.peekPage("nature", 2).images).toHaveLength(9);
    });

    test("does nothing for a page already cached", async () => {
      const source = createInMemoryImageSource({ counts: { nature: 21 } });
      const gallery = createGalleryService({ source });

      await gallery.getPage("nature", 1);
      gallery.prefetchPage("nature", 1);

      expect(source.calls).toHaveLength(3);
    });

    test("swallows failures instead of surfacing them to the user", async () => {
      const source = createInMemoryImageSource({
        counts: { nature: 21 },
        onFetch: () => Promise.reject(new Error("upstream down")),
      });
      const gallery = createGalleryService({ source });

      expect(() => gallery.prefetchPage("nature", 2)).not.toThrow();
      await Promise.resolve();

      expect(gallery.peekPage("nature", 2)).toBeUndefined();
    });
  });

  describe("cancellation", () => {
    test("aborts in-flight requests the predicate selects", async () => {
      const source = createDeferredImageSource();
      const gallery = createGalleryService({ source });

      const abandoned = gallery.getPage("nature", 1);
      const kept = gallery.getPage("fashion", 1);

      gallery.cancelPending((entry) => entry.category !== "fashion");

      await expect(abandoned).rejects.toMatchObject({ name: "AbortError" });
      expect(
        source.pending.filter((entry) => entry.category === "nature")
      ).toHaveLength(0);

      source.flush([]);
      await expect(kept).resolves.toMatchObject({ isLastPage: true });
    });

    test("an aborted page is not cached and can be retried", async () => {
      const source = createDeferredImageSource();
      const gallery = createGalleryService({ source });

      const abandoned = gallery.getPage("nature", 1);
      gallery.cancelPending(() => true);
      await expect(abandoned).rejects.toMatchObject({ name: "AbortError" });

      expect(gallery.peekPage("nature", 1)).toBeUndefined();

      const retried = gallery.getPage("nature", 1);
      expect(source.pending).toHaveLength(3);
      source.flush([]);
      await expect(retried).resolves.toMatchObject({ images: [] });
    });
  });

  test("adapts to a source that can serve a whole page in one call", async () => {
    const source = createInMemoryImageSource({
      counts: { nature: 21 },
      sliceSize: 9,
    });
    const gallery = createGalleryService({ source });

    const { images } = await gallery.getPage("nature", 2);

    expect(source.calls).toEqual([{ category: "nature", slice: 2 }]);
    expect(images).toHaveLength(9);
  });
});
