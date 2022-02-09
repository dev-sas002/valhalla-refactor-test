import { createLegacyImageSource } from "../data/legacyImageSource";

const clientReturning = (value) => ({
  baseUrl: "http://api.test",
  getJson: jest.fn().mockResolvedValue(value),
});

describe("legacyImageSource", () => {
  test("reports the 3-item limit of the legacy API", () => {
    expect(
      createLegacyImageSource({ httpClient: clientReturning([]) }).sliceSize
    ).toBe(3);
  });

  test("sends the category and slice as query parameters", async () => {
    const httpClient = clientReturning([{ name: "nature_4" }]);
    const source = createLegacyImageSource({ httpClient });

    await expect(source.fetchSlice("nature", 2)).resolves.toEqual([
      { name: "nature_4" },
    ]);
    expect(httpClient.getJson).toHaveBeenCalledWith(
      "/images?category=nature&page=2",
      { signal: undefined }
    );
  });

  test("escapes category names", async () => {
    const httpClient = clientReturning([]);

    await createLegacyImageSource({ httpClient }).fetchSlice("sea & sand", 1);

    expect(httpClient.getJson.mock.calls[0][0]).toBe(
      "/images?category=sea+%26+sand&page=1"
    );
  });

  test("forwards the abort signal", async () => {
    const httpClient = clientReturning([]);
    const controller = new AbortController();

    await createLegacyImageSource({ httpClient }).fetchSlice("nature", 1, {
      signal: controller.signal,
    });

    expect(httpClient.getJson.mock.calls[0][1]).toEqual({
      signal: controller.signal,
    });
  });

  test("tolerates a response that is not an array", async () => {
    const source = createLegacyImageSource({
      httpClient: clientReturning(null),
    });

    await expect(source.fetchSlice("nature", 1)).resolves.toEqual([]);
  });

  // The original code threw synchronously out of the promise chain, which
  // stranded the loading state. An async method turns it into a rejection.
  test.each([
    ["", 1],
    [null, 1],
    [123, 1],
    ["nature", 0],
    ["nature", -1],
    ["nature", 1.5],
  ])("rejects rather than throws for (%p, %p)", async (category, slice) => {
    const httpClient = clientReturning([]);
    const source = createLegacyImageSource({ httpClient });

    let result;
    expect(() => {
      result = source.fetchSlice(category, slice);
    }).not.toThrow();

    await expect(result).rejects.toBeInstanceOf(TypeError);
    expect(httpClient.getJson).not.toHaveBeenCalled();
  });
});
