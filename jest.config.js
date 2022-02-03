module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },
  testMatch: ["**/__tests__/**/*.test.js"],
  moduleNameMapper: {
    "\\.(css|less|scss)$": "identity-obj-proxy",
  },
  collectCoverageFrom: [
    "src/refactor-this/**/*.js",
    "!src/refactor-this/app.js",
    "!src/refactor-this/__tests__/**",
  ],
};
