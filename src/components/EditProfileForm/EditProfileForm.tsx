"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import type * as z from "zod";
import { clientProfileSchema } from "@/lib/profileSchemas";
import { PROFILE_NAME_MAX } from "@/constants/profileValidation";
import { updateProfile } from "@/app/me/actions";
import styles from "./EditProfileForm.module.css";

type ProfileFormValues = z.infer<typeof clientProfileSchema>;

interface EditProfileFormProps {
  currentName: string;
}

export default function EditProfileForm({ currentName }: EditProfileFormProps) {
  const { update: updateSession } = useSession();
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(clientProfileSchema),
    defaultValues: {
      name: currentName,
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setServerError("");
    setSuccess(false);

    try {
      const result = await updateProfile({ name: values.name });

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      // Refresh the session so the new name takes effect everywhere
      await updateSession({ name: result.data.name });
      setSuccess(true);
    } catch {
      setServerError("שגיאה בחיבור לשרת. נס.י שוב.");
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <label className={styles.field}>
        <span className={styles.label}>שם תצוגה</span>
        <input
          className={styles.input}
          type="text"
          placeholder="השם שיופיע בביקורות"
          maxLength={PROFILE_NAME_MAX}
          disabled={isSubmitting}
          {...register("name")}
        />
        {errors.name ? (
          <p className={styles.fieldError} role="alert">
            {errors.name.message}
          </p>
        ) : null}
      </label>

      {serverError ? (
        <p className={styles.fieldError} role="alert">
          {serverError}
        </p>
      ) : null}

      <div aria-live="polite" aria-atomic="true">
        {success ? (
          <p className={styles.successMessage} role="status">
            השם עודכן בהצלחה!
          </p>
        ) : null}
      </div>

      <div className={styles.actions}>
        <button
          className={styles.primaryBtn}
          type="submit"
          disabled={isSubmitting || !isDirty}
        >
          {isSubmitting ? (
            <>
              <span className={styles.submitSpinner} aria-hidden="true" />
              <span>מעדכנים...</span>
            </>
          ) : (
            "שמירה"
          )}
        </button>
      </div>
    </form>
  );
}
