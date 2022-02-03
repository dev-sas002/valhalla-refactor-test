import React from "react";

const ImageCard = (props) => {
  const { name, url } = props;

  return (
    <div className="col">
      <img className="image" src={url} alt={name} />
      <div className="middle">
        <a className="btn btn-dark" href={url} download={name}>
          DOWNLOAD
        </a>
      </div>
    </div>
  );
};

export default ImageCard;
