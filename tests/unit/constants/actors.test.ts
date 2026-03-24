import { ACTORS, ACTOR_BY_SLUG, ACTOR_BY_NAME } from "@/constants/actors";

describe("Actor maps", () => {
  it("ACTOR_BY_SLUG has same size as ACTORS (no duplicate slugs)", () => {
    expect(ACTOR_BY_SLUG.size).toBe(ACTORS.length);
  });

  it("ACTOR_BY_NAME has same size as ACTORS (no duplicate names)", () => {
    expect(ACTOR_BY_NAME.size).toBe(ACTORS.length);
  });

  it("every actor is findable by slug", () => {
    for (const actor of ACTORS) {
      expect(ACTOR_BY_SLUG.get(actor.slug)).toBe(actor);
    }
  });

  it("every actor is findable by name", () => {
    for (const actor of ACTORS) {
      expect(ACTOR_BY_NAME.get(actor.name)).toBe(actor);
    }
  });

  it("all slugs have no whitespace", () => {
    for (const actor of ACTORS) {
      expect(actor.slug).not.toMatch(/\s/);
    }
  });

  it("every actor has a non-empty image path", () => {
    for (const actor of ACTORS) {
      expect(actor.image.length).toBeGreaterThan(0);
    }
  });
});
