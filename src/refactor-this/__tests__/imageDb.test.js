/**
 * Contract tests for the legacy image database that the frontend has to live
 * with. They are read-only: the module itself is in `do-not-refactor`, and the
 * pagination assumptions in CategoryScreen depend on this behaviour.
 */
const { get } = require("../../do-not-refactor/image-db");

describe("legacy image-db contract", () => {
  test("returns at most 3 items per page", () => {
    expect(get("nature", 1)).toHaveLength(3);
    expect(get("architecture", 2)).toHaveLength(3);
  });

  test("pages do not overlap", () => {
    const first = get("nature", 1).map((item) => item.name);
    const second = get("nature", 2).map((item) => item.name);

    expect(first).toEqual(["nature_1", "nature_2", "nature_3"]);
    expect(second).toEqual(["nature_4", "nature_5", "nature_6"]);
  });

  test("only returns images of the requested category", () => {
    get("fashion", 1).forEach((item) => {
      expect(item.category).toBe("fashion");
      expect(item.url).toContain("/fashion/");
    });
  });

  test("runs out of items past the end of a category", () => {
    // nature holds 21 images, so page 7 is the last full one.
    expect(get("nature", 7)).toHaveLength(3);
    expect(get("nature", 8)).toHaveLength(0);
  });

  test("returns a partially filled page when the total is not a multiple of 3", () => {
    // architecture holds 23 images: page 8 carries the 2 remaining ones.
    expect(get("architecture", 8)).toHaveLength(2);
    expect(get("architecture", 9)).toHaveLength(0);
  });
});
