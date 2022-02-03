import React, { useEffect, useState } from "react";

import { getImages } from "../API/imageAPI";
import ImageCard from "../components/ImageCard";
import Loader from "../components/Loader";
import Paginator from "../components/Paginator";

const CategoryScreen = (props) => {
  const { category } = props;

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [end, setEnd] = useState(false);
  const [imagesPage1, setImagesPage1] = useState([]);
  const [imagesPage2, setImagesPage2] = useState([]);
  const [imagesPage3, setImagesPage3] = useState([]);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);

    const page1 = page * 3 - 2;
    const page2 = page * 3 - 1;
    const page3 = page * 3;

    Promise.all([
      getImages(category, page1),
      getImages(category, page2),
      getImages(category, page3),
    ])
      .then(([response1, response2, response3]) => {
        if (cancelled) return;

        const data1 = response1?.data ?? [];
        const data2 = response2?.data ?? [];
        const data3 = response3?.data ?? [];

        setImagesPage1(data1);
        setImagesPage2(data2);
        setImagesPage3(data3);
        setEnd(data3.length === 0);
      })
      .catch((error) => {
        if (cancelled) return;

        // Keep the UI consistent: stop loading and clear current results.
        // We set `end=true` so the user can't keep paging forward without data.
        // eslint-disable-next-line no-console
        console.error("Failed loading images:", error);
        setImagesPage1([]);
        setImagesPage2([]);
        setImagesPage3([]);
        setEnd(true);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category, page]);

  return (
    <>
      <div className="container">
        <div id="images" className="row row-cols-3">
          {loading ? (
            <Loader />
          ) : (
            <>
              {imagesPage1.map((image) => (
                <ImageCard url={image.url} name={image.name} key={image.url} />
              ))}

              {imagesPage2.map((image) => (
                <ImageCard url={image.url} name={image.name} key={image.url} />
              ))}

              {imagesPage3.map((image) => (
                <ImageCard url={image.url} name={image.name} key={image.url} />
              ))}
            </>
          )}
        </div>
      </div>

      <Paginator
        prev={() => setPage((prevPage) => prevPage - 1)}
        next={() => setPage((prevPage) => prevPage + 1)}
        page={page}
        end={end}
      />
    </>
  );
};

export default CategoryScreen;

