import React from "react";

const Paginator = (props) => {
  const { next, prev, page, end } = props;

  return (
    <div className="center">
      <ul className="pagination pagination-lg justify-content-center">
        <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
          <button className="page-link" onClick={prev}>
            Previous
          </button>
        </li>
        <li className={`page-item ${end ? "disabled" : ""}`}>
          <button className="page-link" onClick={next}>
            Next
          </button>
        </li>
      </ul>
    </div>
  );
};

export default Paginator;
