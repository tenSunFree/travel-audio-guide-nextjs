const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  testEnvironment: "jsdom",

  roots: ["<rootDir>/src"],

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  setupFilesAfterEnv: ["<rootDir>/src/test/setup.ts"],

  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/page.tsx",
    "!src/**/layout.tsx",
    "!src/test/**",
  ],

  coverageDirectory: "coverage",

  coverageReporters: ["text", "text-summary", "lcov"],
};

module.exports = createJestConfig(customJestConfig);
