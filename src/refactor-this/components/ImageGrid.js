import React from "react";

import ImageCard from "./ImageCard";

const ImageGrid = ({ images }) => (
  <div className="grid" id="images">
    {images.map((image) => (
      <ImageCard key={image.url} url={image.url} name={image.name} />
    ))}
  </div>
);

export default ImageGrid;
