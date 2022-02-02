import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Paginator from "../components/Paginator";

const setup = (props) => {
  const onPrevious = jest.fn();
  const onNext = jest.fn();

  render(
    <Paginator
      page={1}
      onPrevious={onPrevious}
      onNext={onNext}
      canGoPrevious={false}
      canGoNext={false}
      {...props}
    />
  );

  return {
    onPrevious,
    onNext,
    previous: screen.getByRole("button", { name: "Previous" }),
    next: screen.getByRole("button", { name: "Next" }),
  };
};

describe("Paginator", () => {
  test("shows the current page number", () => {
    setup({ page: 4 });

    expect(screen.getByTestId("page-indicator")).toHaveTextContent("Page 4");
  });

  test("disables the directions it is told it cannot go", async () => {
    const { previous, next, onPrevious, onNext } = setup();

    expect(previous).toBeDisabled();
    expect(next).toBeDisabled();

    await userEvent.click(previous);
    await userEvent.click(next);

    expect(onPrevious).not.toHaveBeenCalled();
    expect(onNext).not.toHaveBeenCalled();
  });

  test("reports clicks when navigation is allowed", async () => {
    const { previous, next, onPrevious, onNext } = setup({
      page: 2,
      canGoPrevious: true,
      canGoNext: true,
    });

    await userEvent.click(previous);
    await userEvent.click(next);

    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  test("is exposed as a labelled navigation landmark", () => {
    setup();

    expect(
      screen.getByRole("navigation", { name: "Pagination" })
    ).toBeInTheDocument();
  });
});
