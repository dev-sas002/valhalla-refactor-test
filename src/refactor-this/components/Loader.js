import React from "react";
import { Bars } from "react-loader-spinner";

const Loader = () => {
  return (
    <div className="center" style={{ marginTop: "10%", marginBottom: "10%" }}>
      <Bars color="grey" height={"50%"} width={"50%"} wrapperClass="loader" />
    </div>
  );
};

export default Loader;
