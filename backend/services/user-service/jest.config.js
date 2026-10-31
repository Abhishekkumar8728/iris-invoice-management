export default {
  testEnvironment: "node",

  testMatch: [
    "**/test/**/*.test.js",
  ],

  setupFilesAfterEnv: [
    "<rootDir>/test/setup.js",
  ],

  clearMocks: true,

  restoreMocks: true,

  maxWorkers: 1,
};