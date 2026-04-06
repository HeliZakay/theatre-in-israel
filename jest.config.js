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
    "^.+\\.mjs$": [
      "babel-jest",
      {
        presets: [["@babel/preset-env", { targets: { node: "current" } }]],
      },
    ],
  },
  transformIgnorePatterns: ["/node_modules/"],
};

const config = {
  coverageThreshold: {
    global: {
      statements: 89,
      branches: 80,
      functions: 85,
      lines: 90,
    },
  },
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
