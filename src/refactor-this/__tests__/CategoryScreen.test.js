import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";

import CategoryScreen from "../screens/CategoryScreen";
import { getImages } from "../API/imageAPI";

jest.mock("../API/imageAPI", () => ({
  getImages: jest.fn(),
}));

const deferred = () => {
  let resolve;
  let reject;

  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

describe("CategoryScreen", () => {
  beforeEach(() => {
    getImages.mockReset();
  });

  test("waits for all 3 requests before rendering results", async () => {
    const d1 = deferred();
    const d2 = deferred();
    const d3 = deferred();

    getImages.mockReturnValueOnce(d1.promise);
    getImages.mockReturnValueOnce(d2.promise);
    getImages.mockReturnValueOnce(d3.promise);

    render(<CategoryScreen category="nature" />);

    expect(getImages).toHaveBeenCalledWith("nature", 1);
    expect(getImages).toHaveBeenCalledWith("nature", 2);
    expect(getImages).toHaveBeenCalledWith("nature", 3);

    // While only the first request is resolved, the screen should still be loading.
    await act(async () => {
      d1.resolve({ data: [{ url: "u1", name: "img1" }] });
    });
    expect(screen.getByTestId("loader")).toBeInTheDocument();
    expect(screen.queryByAltText("img1")).not.toBeInTheDocument();

    await act(async () => {
      d2.resolve({ data: [{ url: "u2", name: "img2" }] });
    });
    await act(async () => {
      d3.resolve({ data: [{ url: "u3", name: "img3" }] });
    });

    await waitFor(() => {
      expect(screen.queryByTestId("loader")).not.toBeInTheDocument();
    });

    expect(screen.getByAltText("img1")).toBeInTheDocument();
    expect(screen.getByAltText("img2")).toBeInTheDocument();
    expect(screen.getByAltText("img3")).toBeInTheDocument();
  });

  test("disables Next when the third page is empty", async () => {
    const d1 = deferred();
    const d2 = deferred();
    const d3 = deferred();

    getImages.mockReturnValueOnce(d1.promise);
    getImages.mockReturnValueOnce(d2.promise);
    getImages.mockReturnValueOnce(d3.promise);

    render(<CategoryScreen category="nature" />);

    await act(async () => {
      d1.resolve({ data: [{ url: "u1", name: "img1" }] });
      d2.resolve({ data: [{ url: "u2", name: "img2" }] });
      d3.resolve({ data: [] });
    });

    const nextButton = await screen.findByRole("button", { name: "Next" });
    expect(nextButton).toBeDisabled();
    expect(screen.getByAltText("img1")).toBeInTheDocument();
    expect(screen.getByAltText("img2")).toBeInTheDocument();
  });

  test("stops loading and disables Next when a request fails", async () => {
    const d1 = deferred();
    const d2 = deferred();
    const d3 = deferred();

    getImages.mockReturnValueOnce(d1.promise);
    getImages.mockReturnValueOnce(d2.promise);
    getImages.mockReturnValueOnce(d3.promise);

    render(<CategoryScreen category="nature" />);

    await act(async () => {
      d2.reject(new Error("Network error"));
    });

    // Settle the remaining promises to avoid any potential dangling async work.
    await act(async () => {
      d1.resolve({ data: [{ url: "u1", name: "img1" }] });
      d3.resolve({ data: [{ url: "u3", name: "img3" }] });
    });

    await waitFor(() => {
      expect(screen.queryByTestId("loader")).not.toBeInTheDocument();
    });

    const nextButton = await screen.findByRole("button", { name: "Next" });
    expect(nextButton).toBeDisabled();
    expect(screen.queryByAltText("img1")).not.toBeInTheDocument();
    expect(screen.queryByAltText("img3")).not.toBeInTheDocument();
  });
});

