describe("BASE_URL", () => {
  const originalEnv = process.env.API_BASE_URL;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.API_BASE_URL;
    } else {
      process.env.API_BASE_URL = originalEnv;
    }
    jest.resetModules();
  });

  test("falls back to the local legacy API", () => {
    delete process.env.API_BASE_URL;
    jest.resetModules();

    // eslint-disable-next-line global-require
    const { BASE_URL, DEFAULT_BASE_URL } = require("../constants/url");
    expect(BASE_URL).toBe(DEFAULT_BASE_URL);
    expect(DEFAULT_BASE_URL).toBe("http://localhost:8888");
  });

  test("honours API_BASE_URL when it is set", () => {
    process.env.API_BASE_URL = "https://images.example.com";
    jest.resetModules();

    // eslint-disable-next-line global-require
    const { BASE_URL } = require("../constants/url");
    expect(BASE_URL).toBe("https://images.example.com");
  });

  test("is used as the base URL of the default http client", () => {
    jest.resetModules();

    // eslint-disable-next-line global-require
    const { BASE_URL } = require("../constants/url");
    // eslint-disable-next-line global-require
    const httpClient = require("../data/httpClient").default;

    expect(httpClient.baseUrl).toBe(BASE_URL);
  });
});
