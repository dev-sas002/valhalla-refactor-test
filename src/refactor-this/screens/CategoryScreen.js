import React from "react";

import ImageGrid from "../components/ImageGrid";
import Paginator from "../components/Paginator";
import SkeletonGrid from "../components/SkeletonGrid";
import StatusPanel from "../components/StatusPanel";
import useGalleryPage from "../hooks/useGalleryPage";

/**
 * One category of photos, paged. The screen holds no data logic of its own:
 * it asks `useGalleryPage` what to show and renders one of four states.
 */
const CategoryScreen = ({ category, label }) => {
  const {
    page,
    images,
    status,
    isFirstPage,
    canGoNext,
    canGoPrevious,
    goToNextPage,
    goToPreviousPage,
    retry,
  } = useGalleryPage(category);

  const isLoading = status === "loading";
  const isEmpty = status === "ready" && images.length === 0;

  const announcement = {
    loading: `Loading page ${page} of ${label} photos`,
    error: `Page ${page} of ${label} photos could not be loaded`,
    ready: isEmpty
      ? `No ${label} photos on page ${page}`
      : `Showing ${images.length} ${label} photos on page ${page}`,
  }[status];

  return (
    <main className="page">
      <div className="page__header">
        <h1 className="page__title">{label}</h1>
        <p className="page__status" role="status" aria-live="polite">
          {announcement}
        </p>
      </div>

      {isLoading ? <SkeletonGrid /> : null}

      {status === "error" ? (
        <StatusPanel
          tone="error"
          title="Could not load these photos"
          action={{ label: "Try again", onClick: retry }}
        >
          The photo service did not respond. It is deliberately slow, so this
          can also be a timeout.
        </StatusPanel>
      ) : null}

      {isEmpty ? (
        <StatusPanel
          tone="info"
          title="Nothing to show here"
          action={
            isFirstPage
              ? undefined
              : { label: "Back a page", onClick: goToPreviousPage }
          }
        >
          There are no {label.toLowerCase()} photos on this page.
        </StatusPanel>
      ) : null}

      {status === "ready" && !isEmpty ? <ImageGrid images={images} /> : null}

      <Paginator
        page={page}
        onPrevious={goToPreviousPage}
        onNext={goToNextPage}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
      />
    </main>
  );
};

export default CategoryScreen;
