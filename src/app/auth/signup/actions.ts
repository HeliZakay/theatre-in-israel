"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { checkSignupRateLimit } from "@/utils/rateLimitCheckers";
import { getClientIp } from "@/utils/getClientIp";
import { headers } from "next/headers";
import {
  actionSuccess,
  actionError,
  INTERNAL_ERROR_MESSAGE,
  type ActionResult,
} from "@/types/actionResult";
import { notifyUserSignup } from "@/lib/email";

const BCRYPT_ROUNDS = 12;

const signupSchema = z.object({
  email: z.string().email("כתובת אימייל לא תקינה"),
  password: z
    .string()
    .min(8, "הסיסמה חייבת להכיל לפחות 8 תווים")
    .max(128, "הסיסמה ארוכה מדי"),
  name: z.string().trim().max(100, "השם ארוך מדי").optional(),
});

export async function signup(values: {
  email: string;
  password: string;
  name?: string;
}): Promise<
  ActionResult<{
    user: { id: string; email: string | null; name: string | null };
  }>
> {
  try {
    const headersList = await headers();
    const ip = getClientIp(headersList);
    const rateLimit = await checkSignupRateLimit(ip);
    if (rateLimit.isLimited) {
      return actionError("יותר מדי ניסיונות הרשמה. נס.י שוב מאוחר יותר.");
    }

    const result = signupSchema.safeParse(values);
    if (!result.success) {
      const firstError =
        result.error.issues[0]?.message ?? "חסרים פרטים נדרשים";
      return actionError(firstError);
    }

    const { email, password, name } = result.data;

    // Hash password (always hash to prevent timing attacks that reveal user existence)
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    try {
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || null,
        },
      });

      notifyUserSignup({ email, name }).catch(console.error);

      return actionSuccess({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (err: unknown) {
      // Prisma unique constraint violation (P2002) — email already exists
      // Return generic message to prevent user enumeration
      if (
        err instanceof Error &&
        "code" in err &&
        (err as { code: string }).code === "P2002"
      ) {
        return actionError("לא ניתן ליצור חשבון עם פרטים אלו");
      }
      throw err;
    }
  } catch (error) {
    return actionError(INTERNAL_ERROR_MESSAGE, error);
  }
}
