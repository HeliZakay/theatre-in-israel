import prisma from "../prisma";

export interface UserProfile {
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: Date;
  reviewCount: number;
  watchlistCount: number;
}

/**
 * Fetch user profile data including review and watchlist counts.
 */
export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      image: true,
      createdAt: true,
      _count: {
        select: {
          reviews: true,
          watchlist: true,
        },
      },
    },
  });

  if (!user) return null;

  return {
    name: user.name,
    email: user.email,
    image: user.image,
    createdAt: user.createdAt,
    reviewCount: user._count.reviews,
    watchlistCount: user._count.watchlist,
  };
}
