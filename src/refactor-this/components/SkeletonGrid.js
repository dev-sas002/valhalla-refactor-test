import React from "react";

import { IMAGES_PER_PAGE } from "../constants/general";

/**
 * Placeholder tiles shown while a page is being assembled.
 *
 * The upstream takes 3 seconds and cannot be made faster, so the next best
 * thing is to stop the layout jumping: the skeleton occupies exactly the
 * space the real grid will, which removes the blank-screen-then-reflow the
 * old spinner caused.
 */
const SkeletonGrid = ({ count = IMAGES_PER_PAGE }) => (
  <div className="grid" data-testid="gallery-skeleton" aria-hidden="true">
    {Array.from({ length: count }, (_, index) => (
      <div className="card card--skeleton" key={index} />
    ))}
  </div>
);

export default SkeletonGrid;
