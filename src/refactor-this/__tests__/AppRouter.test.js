import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import AppRouter from "../router";
import NavBar from "../components/NavBar";
import { GalleryProvider } from "../context/GalleryContext";
import { createGalleryService } from "../data/galleryService";
import {
  createDeferredImageSource,
  createInMemoryImageSource,
} from "./helpers/imageSources";

const COUNTS = { nature: 21, architecture: 23, fashion: 22 };

const renderAt = (path, source) => {
  const imageSource = source || createInMemoryImageSource({ counts: COUNTS });
  const gallery = createGalleryService({ source: imageSource });

  const result = render(
    <GalleryProvider gallery={gallery}>
      <MemoryRouter initialEntries={[path]}>
        <NavBar />
        <AppRouter />
      </MemoryRouter>
    </GalleryProvider>
  );

  return { source: imageSource, gallery, ...result };
};

describe("routing", () => {
  test.each([
    ["/", "Nature", "nature_1"],
    ["/architecture", "Architecture", "architecture_1"],
    ["/fashion", "Fashion", "fashion_1"],
  ])("%s shows the %s category", async (path, label, firstImage) => {
    renderAt(path);

    expect(
      screen.getByRole("heading", { level: 1, name: label })
    ).toBeInTheDocument();
    expect(await screen.findByAltText(firstImage)).toBeInTheDocument();
  });

  test("renders a not-found screen for an unknown path", () => {
    renderAt("/does-not-exist");

    expect(
      screen.getByRole("heading", { level: 1, name: "Page not found" })
    ).toBeInTheDocument();
  });

  test("switching category aborts the requests still in flight", async () => {
    const source = createDeferredImageSource();
    renderAt("/", source);

    expect(source.pending.map((entry) => entry.category)).toEqual([
      "nature",
      "nature",
      "nature",
    ]);

    await userEvent.click(screen.getByRole("link", { name: "Fashion" }));

    await waitFor(() =>
      expect(source.pending.map((entry) => entry.category)).toEqual([
        "fashion",
        "fashion",
        "fashion",
      ])
    );
  });

  test("starts a newly opened category at page 1", async () => {
    renderAt("/");
    await screen.findByAltText("nature_1");

    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByAltText("nature_10");
    expect(screen.getByTestId("page-indicator")).toHaveTextContent("Page 2");

    await userEvent.click(screen.getByRole("link", { name: "Fashion" }));

    expect(screen.getByTestId("page-indicator")).toHaveTextContent("Page 1");
    expect(await screen.findByAltText("fashion_1")).toBeInTheDocument();
  });
});

describe("NavBar", () => {
  test("links to every category", () => {
    renderAt("/");

    expect(screen.getByRole("link", { name: "Nature" })).toHaveAttribute(
      "href",
      "/"
    );
    expect(screen.getByRole("link", { name: "Architecture" })).toHaveAttribute(
      "href",
      "/architecture"
    );
    expect(screen.getByRole("link", { name: "Fashion" })).toHaveAttribute(
      "href",
      "/fashion"
    );
  });

  test("marks only the current route as active", () => {
    renderAt("/architecture");

    expect(screen.getByRole("link", { name: "Architecture" })).toHaveClass(
      "active"
    );
    expect(screen.getByRole("link", { name: "Nature" })).not.toHaveClass(
      "active"
    );
    expect(screen.getByRole("link", { name: "Fashion" })).not.toHaveClass(
      "active"
    );
  });
});
