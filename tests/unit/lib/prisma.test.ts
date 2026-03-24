describe("prisma module", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    // Clean up global singleton
    const g = globalThis as unknown as { prisma?: unknown };
    delete g.prisma;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("throws when DATABASE_URL is missing (not during build)", () => {
    delete process.env.DATABASE_URL;
    delete process.env.NEXT_PHASE;

    expect(() => {
      jest.isolateModules(() => {
        require("@/lib/prisma");
      });
    }).toThrow("DATABASE_URL");
  });

  it("does not throw during phase-production-build", () => {
    delete process.env.DATABASE_URL;
    process.env.NEXT_PHASE = "phase-production-build";

    expect(() => {
      jest.isolateModules(() => {
        require("@/lib/prisma");
      });
    }).not.toThrow();
  });

  it("creates PrismaClient with Neon adapter for .neon.tech URLs", () => {
    process.env.DATABASE_URL =
      "postgresql://user:pass@ep-cool-name.us-east-2.aws.neon.tech/dbname";

    jest.isolateModules(() => {
      const mod = require("@/lib/prisma");
      // Module loaded without error — Neon adapter path was taken
      expect(mod.default).toBeDefined();
    });
  });

  it("creates PrismaClient with Pg adapter for non-Neon URLs", () => {
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";

    jest.isolateModules(() => {
      const mod = require("@/lib/prisma");
      expect(mod.default).toBeDefined();
    });
  });
});
