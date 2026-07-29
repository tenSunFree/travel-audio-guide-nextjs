module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|scss)$": "<rootDir>/src/test/style-mock.js"
  },
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.ts"]
};
