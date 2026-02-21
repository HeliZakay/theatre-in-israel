import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import {
  apiError,
  apiSuccess,
  INTERNAL_ERROR_MESSAGE,
} from "@/utils/apiResponse";
import { checkSignupRateLimit } from "@/utils/authRateLimit";

const BCRYPT_ROUNDS = 12;

const signupSchema = z.object({
  email: z.string().email("כתובת אימייל לא תקינה"),
  password: z
    .string()
    .min(8, "הסיסמה חייבת להכיל לפחות 8 תווים")
    .max(128, "הסיסמה ארוכה מדי"),
  name: z.string().trim().max(100, "השם ארוך מדי").optional(),
});

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    const rateLimit = await checkSignupRateLimit(ip);
    if (rateLimit.isLimited) {
      return apiError("יותר מדי ניסיונות הרשמה. נסו שוב מאוחר יותר.", 429);
    }

    const body = await request.json();

    const result = signupSchema.safeParse(body);
    if (!result.success) {
      const firstError =
        result.error.issues[0]?.message ?? "חסרים פרטים נדרשים";
      return apiError(firstError, 400);
    }

    const { email, password, name } = result.data;

    // Hash password (always hash to prevent timing attacks that reveal user existence)
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    try {
      // Create user — unique constraint on email prevents duplicates
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || null,
        },
      });

      return apiSuccess(
        {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        },
        201,
      );
    } catch (err: unknown) {
      // Prisma unique constraint violation (P2002) — email already exists
      // Return generic message to prevent user enumeration
      if (
        err instanceof Error &&
        "code" in err &&
        (err as { code: string }).code === "P2002"
      ) {
        return apiError("לא ניתן ליצור חשבון עם פרטים אלו", 400);
      }
      throw err; // re-throw unexpected errors to be caught by outer catch
    }
  } catch (error) {
    return apiError(INTERNAL_ERROR_MESSAGE, 500, error);
  }
}
