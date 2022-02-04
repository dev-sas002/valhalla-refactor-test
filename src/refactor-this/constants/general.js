export const NATURE = "nature";
export const ARCHITECTURE = "architecture";
export const FASHION = "fashion";

/**
 * The legacy API is fixed at 3 items per response and may not be changed, so
 * one UI page is assembled from several upstream responses ("slices").
 */
export const API_SLICE_SIZE = 3;

/** Images shown per UI page, arranged as a 3 x 3 grid. */
export const IMAGES_PER_PAGE = 9;

/** Upstream requests fired in parallel to fill one UI page. */
export const SLICES_PER_PAGE = IMAGES_PER_PAGE / API_SLICE_SIZE;

/** Route path -> category, used by both the router and the nav bar. */
export const CATEGORY_ROUTES = [
  { path: "/", label: "Nature", category: NATURE },
  { path: "/architecture", label: "Architecture", category: ARCHITECTURE },
  { path: "/fashion", label: "Fashion", category: FASHION },
];
