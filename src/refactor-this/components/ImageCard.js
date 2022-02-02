import React, { useCallback, useState } from "react";

/** Best-effort file name for the downloaded image, e.g. "nature_1.jpeg". */
export const downloadFileName = (name, url) => {
  const extension = String(url).split("?")[0].split(".").pop();
  const hasExtension = Boolean(extension) && extension.length <= 5;

  return hasExtension ? `${name}.${extension}` : name;
};

const ImageCard = ({ name, url }) => {
  const [downloading, setDownloading] = useState(false);

  // The images are served from a different origin than the app, and browsers
  // ignore the `download` attribute on cross-origin links: the original code
  // simply navigated to the jpeg. Fetching the bytes and handing the browser
  // an object URL from our own origin forces a real download.
  const handleDownload = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);

    let objectUrl;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const blob = await response.blob();
      objectUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = downloadFileName(name, url);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed downloading ${name}:`, error);
      // Fall back to opening the image so the user can still save it.
      window.open(url, "_blank", "noopener");
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setDownloading(false);
    }
  }, [downloading, name, url]);

  return (
    <figure className="card">
      <img
        className="card__image"
        src={url}
        alt={name}
        loading="lazy"
        decoding="async"
        width="400"
        height="300"
      />

      <figcaption className="card__overlay">
        <span className="card__name">{name}</span>
        <button
          type="button"
          className="card__download"
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? "Downloading..." : "Download"}
        </button>
      </figcaption>
    </figure>
  );
};

export default ImageCard;
