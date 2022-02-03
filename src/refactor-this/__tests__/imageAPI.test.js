import { getImages } from "../API/imageAPI";
import request from "../API/baseAPI";

jest.mock("../API/baseAPI", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

describe("imageAPI", () => {
  beforeEach(() => {
    request.get.mockReset();
  });

  test("encodes category and passes the correct page to the legacy API", () => {
    request.get.mockReturnValue("mocked-response");

    const result = getImages("nature & sea", 3);

    expect(request.get).toHaveBeenCalledWith(
      `/images?category=nature%20%26%20sea&page=3`
    );
    expect(result).toBe("mocked-response");
  });

  test("throws for invalid category", () => {
    expect(() => getImages("", 1)).toThrow(TypeError);
    expect(() => getImages(null, 1)).toThrow(TypeError);
    expect(() => getImages(123, 1)).toThrow(TypeError);
  });

  test("throws for invalid page", () => {
    expect(() => getImages("nature", 0)).toThrow(TypeError);
    expect(() => getImages("nature", -1)).toThrow(TypeError);
    expect(() => getImages("nature", 1.5)).toThrow(TypeError);
  });
});

