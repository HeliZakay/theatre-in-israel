"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type * as z from "zod";
import { clientContactSchema } from "@/lib/contactSchemas";
import { sendContactMessage } from "@/app/contact/actions";
import {
  CONTACT_NAME_MAX,
  CONTACT_MESSAGE_MAX,
  CONTACT_MESSAGE_MIN,
} from "@/constants/contactValidation";
import styles from "./ContactForm.module.css";

type ContactFormValues = z.infer<typeof clientContactSchema>;

export default function ContactForm() {
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(clientContactSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const messageValue = watch("message") ?? "";

  const onSubmit = async (values: ContactFormValues) => {
    setServerError("");
    try {
      const honeypot =
        (document.getElementById("website") as HTMLInputElement)?.value ?? "";

      const result = await sendContactMessage({
        ...values,
        honeypot,
      });

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      setSuccess(true);
      reset();
    } catch {
      setServerError("שגיאה בחיבור לשרת. נסו שוב.");
    }
  };

  const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(onSubmit)(e);
  };

  if (success) {
    return (
      <div className={styles.successBanner} role="status">
        <span className={styles.successIcon} aria-hidden="true">
          ✓
        </span>
        <div>
          <p className={styles.successTitle}>ההודעה נשלחה בהצלחה!</p>
          <p className={styles.successSubtitle}>נחזור אליך בהקדם.</p>
        </div>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={submitHandler} noValidate>
      {/* Honeypot — hidden from real users, filled by bots */}
      <div aria-hidden="true" className={styles.honeypot}>
        <label htmlFor="website">Website</label>
        <input
          type="text"
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <label className={styles.field}>
        <span className={styles.label}>שם</span>
        <input
          className={styles.input}
          type="text"
          placeholder="השם שלך"
          maxLength={CONTACT_NAME_MAX}
          disabled={isSubmitting}
          {...register("name")}
        />
        {errors.name ? (
          <p className={styles.fieldError} role="alert">
            {errors.name.message}
          </p>
        ) : null}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>אימייל</span>
        <input
          className={styles.input}
          type="email"
          placeholder="example@email.com"
          dir="ltr"
          disabled={isSubmitting}
          {...register("email")}
        />
        {errors.email ? (
          <p className={styles.fieldError} role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>הודעה</span>
        <textarea
          className={styles.textarea}
          placeholder="מה תרצו לשתף?"
          maxLength={CONTACT_MESSAGE_MAX}
          disabled={isSubmitting}
          rows={5}
          {...register("message")}
        />
        <span className={styles.charMeta}>
          {messageValue.length}/{CONTACT_MESSAGE_MAX} (מינימום{" "}
          {CONTACT_MESSAGE_MIN})
        </span>
        {errors.message ? (
          <p className={styles.fieldError} role="alert">
            {errors.message.message}
          </p>
        ) : null}
      </label>

      {serverError ? (
        <p className={styles.fieldError} role="alert">
          {serverError}
        </p>
      ) : null}

      <div className={styles.actions}>
        <button
          className={styles.primaryBtn}
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className={styles.submitSpinner} aria-hidden="true" />
              <span>שולחים...</span>
            </>
          ) : (
            "שליחת הודעה"
          )}
        </button>
      </div>
    </form>
  );
}
