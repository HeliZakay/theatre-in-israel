/** @type {import('jest').Config} */
const shared = {
  preset: "ts-jest",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },
};

const config = {
  projects: [
    {
      ...shared,
      displayName: "unit",
      testEnvironment: "node",
      roots: ["<rootDir>/tests/unit"],
      testMatch: ["**/tests/unit/**/*.test.ts"],
    },
    {
      ...shared,
      displayName: "component",
      testEnvironment: "jsdom",
      roots: ["<rootDir>/tests/component"],
      testMatch: ["**/tests/component/**/*.test.tsx"],
      setupFilesAfterEnv: ["<rootDir>/tests/setup-component.tsx"],
      moduleNameMapper: {
        "\\.module\\.css$": "identity-obj-proxy",
        "\\.css$": "identity-obj-proxy",
        ...shared.moduleNameMapper,
      },
    },
  ],
};

module.exports = config;
