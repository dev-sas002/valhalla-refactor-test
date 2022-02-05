import React from "react";
import { Route, Routes } from "react-router-dom";

import CategoryScreen from "../screens/CategoryScreen";
import { CATEGORY_ROUTES } from "../constants/general";

/**
 * Every category renders the same screen with a different prop, so there are
 * no per-category components to keep in sync. `key` forces a fresh mount on a
 * category change, which resets the paging state.
 */
const AppRouter = () => (
  <Routes>
    {CATEGORY_ROUTES.map(({ path, category, label }) => (
      <Route
        key={path}
        path={path}
        element={
          <CategoryScreen key={category} category={category} label={label} />
        }
      />
    ))}

    <Route
      path="*"
      element={
        <main className="page">
          <h1 className="page__title">Page not found</h1>
        </main>
      }
    />
  </Routes>
);

export default AppRouter;
