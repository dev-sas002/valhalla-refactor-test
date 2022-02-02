import React from "react";
import { NavLink } from "react-router-dom";

import { CATEGORY_ROUTES } from "../constants/general";

const navLinkClass = ({ isActive }) =>
  `navbar__link${isActive ? " active" : ""}`;

const NavBar = () => (
  <header className="navbar">
    <NavLink className="navbar__brand" to="/">
      Photo Sharing App
    </NavLink>

    <nav className="navbar__nav" aria-label="Photo categories">
      {CATEGORY_ROUTES.map(({ path, label }) => (
        <NavLink key={path} to={path} className={navLinkClass} end>
          {label}
        </NavLink>
      ))}
    </nav>
  </header>
);

export default NavBar;
