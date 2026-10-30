module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
  moduleNameMapper: {
    "^@config/(.*)$": "<rootDir>/src/config/$1",
    "^@middleware/(.*)$": "<rootDir>/src/middleware/$1",
    "^@modules/(.*)$": "<rootDir>/src/modules/$1",
    "^@services/(.*)$": "<rootDir>/src/services/$1",
    "^@utils/(.*)$": "<rootDir>/src/utils/$1",
    "^@shared-types/(.*)$": "<rootDir>/../../packages/shared-types/src/$1",
    "^@sms/database$": "<rootDir>/../../packages/database/index.ts"
  },
  setupFilesAfterEnv: [],
};
