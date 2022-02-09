import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ImageCard, { downloadFileName } from "../components/ImageCard";

describe("downloadFileName", () => {
  test("appends the extension taken from the url", () => {
    expect(
      downloadFileName("nature_1", "http://host/nature/nature_1.jpeg")
    ).toBe("nature_1.jpeg");
  });

  test("ignores the query string", () => {
    expect(downloadFileName("a", "http://host/a.png?v=2")).toBe("a.png");
  });

  test("falls back to the bare name when no extension can be found", () => {
    expect(downloadFileName("a", "http://host/images/a")).toBe("a");
  });
});

describe("ImageCard", () => {
  const url = "http://localhost:8888/static/images/nature/nature_1.jpeg";
  let clickSpy;

  beforeEach(() => {
    clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    global.URL.createObjectURL = jest.fn(() => "blob:generated-url");
    global.URL.revokeObjectURL = jest.fn();
    global.fetch = jest.fn();
    jest.spyOn(window, "open").mockImplementation(() => null);
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete global.fetch;
  });

  test("renders the image lazily with the name as alt text", () => {
    render(<ImageCard name="nature_1" url={url} />);

    const image = screen.getByAltText("nature_1");
    expect(image).toHaveAttribute("src", url);
    expect(image).toHaveAttribute("loading", "lazy");
    // Intrinsic size keeps the tile from reflowing once the photo arrives.
    expect(image).toHaveAttribute("width", "400");
    expect(image).toHaveAttribute("height", "300");
  });

  test("names the photo and offers a real button, not a link", () => {
    render(<ImageCard name="nature_1" url={url} />);

    expect(screen.getByText("nature_1")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  test("downloads the blob instead of following the cross-origin link", async () => {
    const blob = new Blob(["binary"], { type: "image/jpeg" });
    global.fetch.mockResolvedValue({ ok: true, blob: async () => blob });

    render(<ImageCard name="nature_1" url={url} />);

    await userEvent.click(screen.getByRole("button", { name: "Download" }));

    await waitFor(() => {
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(blob);
    });

    expect(global.fetch).toHaveBeenCalledWith(url);
    expect(clickSpy).toHaveBeenCalled();

    // The anchor that was actually clicked is the generated one, carrying the
    // blob URL and the file name - not the original cross-origin href.
    const clickedAnchor = clickSpy.mock.instances[0];
    expect(clickedAnchor.href).toBe("blob:generated-url");
    expect(clickedAnchor.download).toBe("nature_1.jpeg");

    await waitFor(() => {
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(
        "blob:generated-url"
      );
    });
    expect(window.open).not.toHaveBeenCalled();
  });

  test("opens the image in a new tab when the fetch fails", async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 500 });

    render(<ImageCard name="nature_1" url={url} />);

    await userEvent.click(screen.getByRole("button", { name: "Download" }));

    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith(url, "_blank", "noopener");
    });
    expect(global.URL.createObjectURL).not.toHaveBeenCalled();
  });

  test("recovers when the network rejects", async () => {
    global.fetch.mockRejectedValue(new Error("offline"));

    render(<ImageCard name="nature_1" url={url} />);

    await userEvent.click(screen.getByRole("button", { name: "Download" }));

    await waitFor(() => {
      expect(window.open).toHaveBeenCalled();
    });

    // The button returns to its idle label so it stays clickable.
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Download" })).toBeEnabled();
    });
  });
});
