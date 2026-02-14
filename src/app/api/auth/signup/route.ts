import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import {
  apiError,
  apiSuccess,
  INTERNAL_ERROR_MESSAGE,
} from "@/utils/apiResponse";

const signupSchema = z.object({
  email: z.string().email("כתובת אימייל לא תקינה"),
  password: z.string().min(6, "הסיסמה חייבת להכיל לפחות 6 תווים"),
  name: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = signupSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues[0]?.message ?? "חסרים פרטים נדרשים";
      return apiError(firstError, 400);
    }

    const { email, password, name } = result.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return apiError("משתמש עם אימייל זה כבר קיים", 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
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
  } catch (error) {
    return apiError(INTERNAL_ERROR_MESSAGE, 500, error);
  }
}
