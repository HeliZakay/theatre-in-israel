/** Pre-seeded test user credentials */
export const TEST_USER = {
  name: "Test User",
  email: "test@e2e.com",
  password: "TestPassword123!",
  // This ID will be set after the DB is seeded — for session injection,
  // we look it up at runtime from the DB.
} as const;
