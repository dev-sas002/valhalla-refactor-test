import { useCallback, useEffect, useState } from "react";

import { useGallery } from "../context/GalleryContext";
import { isAbortError } from "../data/galleryService";

/**
 * Binds the framework-free gallery service to React.
 *
 * All the awkward parts of "slow upstream, fast user" live here: keeping the
 * page number, ignoring results the user has navigated away from, aborting
 * requests for an abandoned category, prefetching the next page and rendering
 * a cached page with no loading frame at all.
 *
 * @param {String} category
 */
export const useGalleryPage = (category) => {
  const gallery = useGallery();

  const [nav, setNav] = useState({ category, page: 1 });
  const [attempt, setAttempt] = useState(0);
  const [request, setRequest] = useState({ status: "loading", error: null });
  // Key of the page the prefetch has proved to be the last one.
  const [provenLast, setProvenLast] = useState(null);

  // Derive-during-render reset: a new category always starts at page 1.
  if (nav.category !== category) setNav({ category, page: 1 });
  const page = nav.category === category ? nav.page : 1;

  // A page already in the cache is rendered straight away, with no skeleton.
  const entry = gallery.peekPage(category, page);

  useEffect(() => {
    // Requests for a category the user has navigated away from are wasted
    // upstream capacity; abort them rather than merely ignoring the result.
    gallery.cancelPending((pending) => pending.category !== category);
  }, [gallery, category]);

  useEffect(() => {
    let active = true;

    if (gallery.peekPage(category, page)) {
      setRequest({ status: "ready", error: null });

      return undefined;
    }

    setRequest({ status: "loading", error: null });

    gallery
      .getPage(category, page)
      .then(() => {
        if (active) setRequest({ status: "ready", error: null });
      })
      .catch((error) => {
        if (!active || isAbortError(error)) return;

        setRequest({ status: "error", error });
      });

    return () => {
      active = false;
    };
  }, [gallery, category, page, attempt]);

  useEffect(() => {
    // Spend the 3 seconds the user is looking at this page fetching the next
    // one, so "Next" is usually instant.
    if (!entry || entry.isLastPage) return undefined;

    let active = true;

    gallery.prefetchPage(category, page + 1).then((next) => {
      // A full page followed by an empty one is still the last page. The old
      // short-page check could not see that, so Next stayed enabled and led
      // the user into a blank grid.
      if (active && next && next.images.length === 0) {
        setProvenLast(`${category}:${page}`);
      }
    });

    return () => {
      active = false;
    };
  }, [gallery, category, page, entry]);

  const status = entry ? "ready" : request.status;
  const images = entry ? entry.images : [];

  // The page is the last one if it is short, or if the prefetch has already
  // proved the following page is empty.
  const isLastPage = Boolean(
    entry && (entry.isLastPage || provenLast === `${category}:${page}`)
  );

  const goToNextPage = useCallback(() => {
    setNav((current) => ({ ...current, page: current.page + 1 }));
  }, []);

  const goToPreviousPage = useCallback(() => {
    setNav((current) => ({
      ...current,
      page: Math.max(1, current.page - 1),
    }));
  }, []);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return {
    page,
    images,
    status,
    error: request.error,
    isLastPage,
    isFirstPage: page === 1,
    // Paging forward needs data to page forward from; paging back only needs
    // somewhere to go, so it stays available even when the page failed.
    canGoNext: status === "ready" && !isLastPage,
    canGoPrevious: page > 1 && status !== "loading",
    goToNextPage,
    goToPreviousPage,
    retry,
  };
};

export default useGalleryPage;
