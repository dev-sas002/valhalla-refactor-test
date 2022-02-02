import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CategoryScreen from "../screens/CategoryScreen";
import { GalleryProvider } from "../context/GalleryContext";
import { createGalleryService } from "../data/galleryService";
import {
  createDeferredImageSource,
  createInMemoryImageSource,
} from "./helpers/imageSources";

const renderScreen = ({
  counts = { nature: 21 },
  category = "nature",
  label = "Nature",
  ...sourceOptions
} = {}) => {
  const source = createInMemoryImageSource({ counts, ...sourceOptions });
  const gallery = createGalleryService({ source });

  const result = render(
    <GalleryProvider gallery={gallery}>
      <CategoryScreen category={category} label={label} />
    </GalleryProvider>
  );

  return { source, gallery, ...result };
};

const waitForPhotos = (count) =>
  waitFor(() => expect(screen.getAllByRole("img")).toHaveLength(count));

const nextButton = () => screen.getByRole("button", { name: "Next" });
const previousButton = () => screen.getByRole("button", { name: "Previous" });

describe("CategoryScreen", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("shows skeleton tiles while a page is assembled, then the photos", async () => {
    renderScreen();

    expect(screen.getByTestId("gallery-skeleton")).toBeInTheDocument();
    expect(screen.queryAllByRole("img")).toHaveLength(0);

    await waitForPhotos(9);
    expect(screen.queryByTestId("gallery-skeleton")).not.toBeInTheDocument();
    expect(screen.getByAltText("nature_1")).toBeInTheDocument();
    expect(screen.getByAltText("nature_9")).toBeInTheDocument();
  });

  test("keeps the skeleton up until every slice of the page has answered", async () => {
    const source = createDeferredImageSource();
    const gallery = createGalleryService({ source });

    render(
      <GalleryProvider gallery={gallery}>
        <CategoryScreen category="nature" label="Nature" />
      </GalleryProvider>
    );

    // Three requests, all outstanding at once - not one after another.
    expect(source.pending).toHaveLength(3);

    await waitFor(() =>
      expect(screen.getByTestId("gallery-skeleton")).toBeInTheDocument()
    );
    expect(screen.queryAllByRole("img")).toHaveLength(0);
  });

  test("renders 9 photos and enables Next on a full page", async () => {
    renderScreen();
    await waitForPhotos(9);

    expect(nextButton()).not.toBeDisabled();
    expect(previousButton()).toBeDisabled();
    expect(screen.getByTestId("page-indicator")).toHaveTextContent("Page 1");
  });

  test("prefetches the next page, so Next costs no new upstream requests", async () => {
    const { source } = renderScreen();
    await waitForPhotos(9);

    // The prefetch of page 2 runs while the user is looking at page 1.
    await waitFor(() => expect(source.calls).toHaveLength(6));

    await userEvent.click(nextButton());

    expect(screen.queryByTestId("gallery-skeleton")).not.toBeInTheDocument();
    expect(screen.getByAltText("nature_10")).toBeInTheDocument();
    expect(screen.getByTestId("page-indicator")).toHaveTextContent("Page 2");

    // 6 for pages 1 and 2, plus the prefetch of page 3. Page 2 itself was
    // never refetched.
    await waitFor(() => expect(source.calls).toHaveLength(9));
    expect(
      source.calls.filter((call) => [4, 5, 6].includes(call.slice))
    ).toHaveLength(3);
  });

  test("serves Previous from cache without going back to the API", async () => {
    const { source } = renderScreen();
    await waitForPhotos(9);
    await waitFor(() => expect(source.calls).toHaveLength(6));

    await userEvent.click(nextButton());
    await waitFor(() =>
      expect(screen.getByAltText("nature_10")).toBeInTheDocument()
    );
    const callsOnPageTwo = source.calls.length;

    await userEvent.click(previousButton());

    expect(screen.getByAltText("nature_1")).toBeInTheDocument();
    expect(screen.queryByTestId("gallery-skeleton")).not.toBeInTheDocument();
    expect(source.calls).toHaveLength(callsOnPageTwo);
  });

  test("disables Next on a partially filled last page", async () => {
    // 21 nature images: page 3 holds the last 3.
    const { source } = renderScreen();
    await waitForPhotos(9);
    await waitFor(() => expect(source.calls).toHaveLength(6));

    await userEvent.click(nextButton());
    await waitForPhotos(9);
    await waitFor(() => expect(source.calls).toHaveLength(9));

    await userEvent.click(nextButton());
    await waitForPhotos(3);

    expect(screen.getByTestId("page-indicator")).toHaveTextContent("Page 3");
    expect(nextButton()).toBeDisabled();
    expect(previousButton()).not.toBeDisabled();
  });

  test("disables Next when the prefetch proves the following page is empty", async () => {
    // Exactly two full pages: the old short-page check could not see that
    // page 3 was empty, so Next stayed enabled and led to a blank grid.
    renderScreen({ counts: { nature: 18 } });
    await waitForPhotos(9);
    expect(nextButton()).not.toBeDisabled();

    await userEvent.click(nextButton());
    await waitForPhotos(9);

    await waitFor(() => expect(nextButton()).toBeDisabled());
  });

  test("shows an error panel with a working retry when the API fails", async () => {
    let failing = true;
    const { source } = renderScreen({
      onFetch: () => {
        if (failing) return Promise.reject(new Error("upstream down"));

        return undefined;
      },
    });

    expect(
      await screen.findByText("Could not load these photos")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("gallery-skeleton")).not.toBeInTheDocument();
    expect(nextButton()).toBeDisabled();

    failing = false;
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    await waitForPhotos(9);
    expect(source.calls.length).toBeGreaterThan(3);
  });

  test("shows an empty panel rather than a blank grid", async () => {
    renderScreen({ counts: { nature: 0 } });

    expect(await screen.findByText("Nothing to show here")).toBeInTheDocument();
    expect(screen.queryAllByRole("img")).toHaveLength(0);
    expect(nextButton()).toBeDisabled();
  });

  test("surfaces a bad category as an error instead of loading forever", async () => {
    renderScreen({ category: "", label: "Nothing" });

    expect(
      await screen.findByText("Could not load these photos")
    ).toBeInTheDocument();
  });

  test("announces what is on screen for assistive technology", async () => {
    renderScreen();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading page 1 of Nature photos"
    );

    await waitForPhotos(9);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Showing 9 Nature photos on page 1"
    );
  });

  test("pagination controls are disabled while a page is loading", async () => {
    renderScreen();

    expect(nextButton()).toBeDisabled();
    expect(previousButton()).toBeDisabled();

    await waitForPhotos(9);
    expect(nextButton()).not.toBeDisabled();
  });
});
