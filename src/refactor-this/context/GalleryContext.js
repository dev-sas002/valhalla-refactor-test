import React, { createContext, useContext } from "react";

const GalleryContext = createContext(null);

/**
 * Injects the gallery service into the tree.
 *
 * Components never import a data module directly, so swapping the image
 * source - the legacy API, a real paginated API, a fixture - is a change in
 * `app.js` only, and tests drive the whole UI through an in-memory source
 * instead of mocking modules.
 */
export const GalleryProvider = ({ gallery, children }) => (
  <GalleryContext.Provider value={gallery}>{children}</GalleryContext.Provider>
);

export const useGallery = () => {
  const gallery = useContext(GalleryContext);

  if (!gallery) {
    throw new Error("useGallery must be used inside a <GalleryProvider>");
  }

  return gallery;
};

export default GalleryContext;
