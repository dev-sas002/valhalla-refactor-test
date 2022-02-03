import React from "react";
import { Link } from "react-router-dom";

const NavBar = (props) => {
  const {} = props;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <Link className="navbar-brand" to="/">
        Photo Sharing App
      </Link>
      <div className="collapse navbar-collapse" id="navbarNavAltMarkup">
        <div className="navbar-nav">
          <Link to="/" className="nav-link active">
            Nature
          </Link>
          <Link to="/architecture" className="nav-link active">
            Architecture
          </Link>
          <Link to="/fashion" className="nav-link active">
            fashion
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
