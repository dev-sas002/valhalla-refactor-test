import React from "react";

const Paginator = (props) => {
  const { next, prev, page, end } = props;

  const isPrevDisabled = page === 1;
  const isNextDisabled = Boolean(end);

  return (
    <div className="center">
      <ul className="pagination pagination-lg justify-content-center">
        <li className={`page-item ${isPrevDisabled ? "disabled" : ""}`}>
          <button
            type="button"
            className="page-link"
            disabled={isPrevDisabled}
            onClick={() => {
              if (!isPrevDisabled) prev();
            }}
          >
            Previous
          </button>
        </li>
        <li className={`page-item ${isNextDisabled ? "disabled" : ""}`}>
          <button
            type="button"
            className="page-link"
            disabled={isNextDisabled}
            onClick={() => {
              if (!isNextDisabled) next();
            }}
          >
            Next
          </button>
        </li>
      </ul>
    </div>
  );
};

export default Paginator;
