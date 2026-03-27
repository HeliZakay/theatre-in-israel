import prisma from "../prisma";
import type { Suggestions } from "@/types";

/**
 * Build autocomplete suggestions from distinct show values.
 */
export async function getSuggestions(): Promise<Suggestions> {
  const [showFields, genreNames] = await Promise.all([
    prisma.show.findMany({ select: { title: true, theatre: true } }),
    prisma.genre.findMany({ select: { name: true } }),
  ]);

  return {
    shows: Array.from(new Set(showFields.map((s) => s.title).filter(Boolean))),
    theatres: Array.from(
      new Set(showFields.map((s) => s.theatre).filter(Boolean)),
    ),
    genres: genreNames.map((g) => g.name).filter(Boolean),
  };
}
