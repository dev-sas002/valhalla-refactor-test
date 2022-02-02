import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ErrorBoundary from "../components/ErrorBoundary";
import { GalleryProvider, useGallery } from "../context/GalleryContext";

const Boom = ({ explode }) => {
  if (explode) throw new Error("render exploded");

  return <p>All good</p>;
};

describe("ErrorBoundary", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders its children when nothing throws", () => {
    render(
      <ErrorBoundary>
        <Boom explode={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText("All good")).toBeInTheDocument();
  });

  test("replaces a crashed tree with a recoverable message", async () => {
    const { rerender } = render(
      <ErrorBoundary>
        <Boom explode />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    rerender(
      <ErrorBoundary>
        <Boom explode={false} />
      </ErrorBoundary>
    );
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(screen.getByText("All good")).toBeInTheDocument();
  });
});

describe("useGallery", () => {
  const Consumer = () => {
    const gallery = useGallery();

    return <p>{String(gallery.marker)}</p>;
  };

  test("returns the injected gallery", () => {
    render(
      <GalleryProvider gallery={{ marker: "injected" }}>
        <Consumer />
      </GalleryProvider>
    );

    expect(screen.getByText("injected")).toBeInTheDocument();
  });

  test("fails loudly when used outside a provider", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Consumer />)).toThrow(
      "useGallery must be used inside a <GalleryProvider>"
    );
  });
});
