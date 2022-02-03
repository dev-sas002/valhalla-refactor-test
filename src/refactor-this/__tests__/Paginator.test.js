import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Paginator from "../components/Paginator";

describe("Paginator", () => {
  test("disables Previous on the first page", async () => {
    const prev = jest.fn();
    const next = jest.fn();

    render(<Paginator prev={prev} next={next} page={1} end={false} />);

    const prevButton = screen.getByRole("button", { name: "Previous" });
    expect(prevButton).toBeDisabled();

    await userEvent.click(prevButton);
    expect(prev).not.toHaveBeenCalled();
  });

  test("disables Next when `end` is true", async () => {
    const prev = jest.fn();
    const next = jest.fn();

    render(<Paginator prev={prev} next={next} page={2} end={true} />);

    const nextButton = screen.getByRole("button", { name: "Next" });
    expect(nextButton).toBeDisabled();

    await userEvent.click(nextButton);
    expect(next).not.toHaveBeenCalled();
  });

  test("enables and triggers callbacks when pagination is allowed", async () => {
    const prev = jest.fn();
    const next = jest.fn();

    render(<Paginator prev={prev} next={next} page={2} end={false} />);

    const prevButton = screen.getByRole("button", { name: "Previous" });
    const nextButton = screen.getByRole("button", { name: "Next" });

    expect(prevButton).not.toBeDisabled();
    expect(nextButton).not.toBeDisabled();

    await userEvent.click(prevButton);
    await userEvent.click(nextButton);

    expect(prev).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

