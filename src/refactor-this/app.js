import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";

import "./css/styles.css";

import ErrorBoundary from "./components/ErrorBoundary";
import NavBar from "./components/NavBar";
import AppRouter from "./router";
import { GalleryProvider } from "./context/GalleryContext";
import { createGalleryService } from "./data/galleryService";
import { createLegacyImageSource } from "./data/legacyImageSource";

// The only place that decides where photos come from. Point this at a
// different ImageSource and nothing else in the app changes.
const gallery = createGalleryService({ source: createLegacyImageSource() });

const App = () => (
  <ErrorBoundary>
    <GalleryProvider gallery={gallery}>
      <BrowserRouter>
        <NavBar />
        <AppRouter />
      </BrowserRouter>
    </GalleryProvider>
  </ErrorBoundary>
);

ReactDOM.render(<App />, document.getElementById("main-view"));
