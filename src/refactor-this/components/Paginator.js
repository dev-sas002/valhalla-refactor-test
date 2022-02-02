import React from "react";

/**
 * Page controls. Purely presentational: it is told where it is and what is
 * allowed, and reports clicks back.
 */
const Paginator = ({ page, onPrevious, onNext, canGoPrevious, canGoNext }) => (
  <nav className="paginator" aria-label="Pagination">
    <button
      type="button"
      className="paginator__button"
      disabled={!canGoPrevious}
      onClick={onPrevious}
    >
      Previous
    </button>

    <span className="paginator__page" data-testid="page-indicator">
      Page {page}
    </span>

    <button
      type="button"
      className="paginator__button"
      disabled={!canGoNext}
      onClick={onNext}
    >
      Next
    </button>
  </nav>
);

export default Paginator;
