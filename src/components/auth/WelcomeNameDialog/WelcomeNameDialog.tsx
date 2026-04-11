"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import * as Dialog from "@radix-ui/react-dialog";
import { clientProfileSchema } from "@/lib/profileSchemas";
import { PROFILE_NAME_MAX } from "@/constants/profileValidation";
import { updateProfile } from "@/app/me/actions";
import styles from "./WelcomeNameDialog.module.css";

export default function WelcomeNameDialog() {
  const { data: session, update: updateSession } = useSession();
  const [name, setName] = useState("");
  const [nameInitialized, setNameInitialized] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOpen = session?.user?.isNewUser === true;

  // Initialize name from session once available
  if (isOpen && !nameInitialized) {
    setName(session.user?.name ?? "");
    setNameInitialized(true);
  }

  const handleSave = async () => {
    setError("");
    const result = clientProfileSchema.safeParse({ name });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "שם לא תקין");
      return;
    }

    setIsSubmitting(true);
    try {
      const updateResult = await updateProfile({ name: result.data.name });
      if (!updateResult.success) {
        setError(updateResult.error);
        return;
      }
      await updateSession({ name: updateResult.data.name, isNewUser: false });
    } catch {
      setError("שגיאה בחיבור לשרת. נס.י שוב.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog.Root open>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.dialogOverlay} />
        <Dialog.Content
          className={styles.dialogContent}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <Dialog.Title className={styles.dialogTitle}>
            ברוכים הבאים!
          </Dialog.Title>
          <Dialog.Description className={styles.dialogDescription}>
            השם הזה יופיע בביקורות שתכתוב.י. אפשר לשנות אותו עכשיו או להשאיר
            את השם מגוגל.
          </Dialog.Description>

          <label className={styles.field}>
            <span className={styles.label}>שם תצוגה</span>
            <input
              className={styles.input}
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              maxLength={PROFILE_NAME_MAX}
              disabled={isSubmitting}
              autoFocus
            />
            {error ? (
              <p className={styles.fieldError} role="alert">
                {error}
              </p>
            ) : null}
          </label>

          <div className={styles.dialogActions}>
            <button
              type="button"
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span
                    className={styles.submitSpinner}
                    aria-hidden="true"
                  />
                  <span>שומרים...</span>
                </>
              ) : (
                "שמירה"
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
