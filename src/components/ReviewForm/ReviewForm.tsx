"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import styles from "@/app/reviews/new/page.module.css";
import ROUTES from "@/constants/routes";
import AppSelect from "@/components/AppSelect/AppSelect";
import ShowCombobox from "@/components/ShowCombobox/ShowCombobox";
import {
  REVIEW_COMMENT_MAX,
  REVIEW_COMMENT_MIN,
  REVIEW_NAME_MAX,
  REVIEW_NAME_MIN,
  REVIEW_TITLE_MAX,
  REVIEW_TITLE_MIN,
} from "@/constants/reviewValidation";
import type { Show } from "@/types";

const reviewSchema = z.object({
  showId: z.string().trim().min(1, "יש לבחור הצגה"),
  name: z
    .string()
    .trim()
    .min(REVIEW_NAME_MIN, "הכניס.י שם חוקי")
    .max(REVIEW_NAME_MAX, `השם יכול להכיל עד ${REVIEW_NAME_MAX} תווים`),
  title: z
    .string()
    .trim()
    .min(REVIEW_TITLE_MIN, "הכניס.י כותרת")
    .max(REVIEW_TITLE_MAX, `הכותרת יכולה להכיל עד ${REVIEW_TITLE_MAX} תווים`),
  rating: z.preprocess(
    (v) => (typeof v === "string" ? parseInt(v, 10) : v),
    z.number().int().min(1).max(5),
  ),
  comment: z
    .string()
    .trim()
    .min(
      REVIEW_COMMENT_MIN,
      `תגובה צריכה להכיל לפחות ${REVIEW_COMMENT_MIN} תווים`,
    )
    .max(
      REVIEW_COMMENT_MAX,
      `התגובה יכולה להכיל עד ${REVIEW_COMMENT_MAX} תווים`,
    ),
});

const ratingOptions = [
  { value: "5", label: "5 - מצוין" },
  { value: "4", label: "4 - טוב מאוד" },
  { value: "3", label: "3 - סביר" },
  { value: "2", label: "2 - פחות" },
  { value: "1", label: "1 - לא מומלץ" },
];

interface ReviewFormProps {
  shows?: Show[];
  initialShowId?: number | string;
}

export default function ReviewForm({
  shows = [],
  initialShowId = "",
}: ReviewFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      showId: String(initialShowId ?? ""),
      name: "",
      title: "",
      rating: "",
      comment: "",
    },
  });

  const showOptions = shows.map((show) => ({
    value: String(show.id),
    label: show.title,
  }));
  const nameValue = useWatch({ control, name: "name" }) ?? "";
  const titleValue = useWatch({ control, name: "title" }) ?? "";
  const commentValue = useWatch({ control, name: "comment" }) ?? "";

  const onSubmit = async (values: z.infer<typeof reviewSchema>) => {
    setServerError("");
    try {
      const formData = new FormData();
      formData.set("showId", values.showId);
      formData.set("name", values.name);
      formData.set("title", values.title);
      formData.set("rating", String(values.rating));
      formData.set("comment", values.comment);

      const res = await fetch(ROUTES.API_REVIEWS, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setServerError(json?.error || "שגיאה במהלך שליחת הבקשה");
        return;
      }

      // Show inline success and navigate after a short delay
      setSuccess(true);
      timerRef.current = setTimeout(() => {
        router.push(`/shows/${values.showId}`);
      }, 1800);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : String(err));
    }
  };

  // Wrap react-hook-form's `handleSubmit` so we don't call it during
  // render (some lint rules flag calling it directly in JSX). This
  // returns an event handler that will invoke the RHF submit logic.
  const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(onSubmit)(e);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <form className={styles.form} onSubmit={submitHandler} noValidate>
      {shows.length ? (
        <label className={styles.field}>
          <span className={styles.label}>הצגה</span>
          <Controller
            name="showId"
            control={control}
            render={({ field }) => (
              <ShowCombobox
                id="showId"
                value={field.value ?? ""}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                options={showOptions}
                placeholder="חפש.י הצגה…"
                invalid={Boolean(errors.showId)}
                ariaDescribedBy={errors.showId ? "showId-error" : undefined}
              />
            )}
          />
          {errors.showId ? (
            <p id="showId-error" className={styles.fieldError} role="alert">
              {errors.showId.message}
            </p>
          ) : null}
        </label>
      ) : (
        <input type="hidden" {...register("showId")} />
      )}

      <label className={styles.field}>
        <span className={styles.label}>שם מלא</span>
        <input
          className={styles.input}
          maxLength={REVIEW_NAME_MAX}
          {...register("name")}
        />
        {errors.name ? (
          <p className={styles.fieldError}>{errors.name.message}</p>
        ) : null}
        <p className={styles.charMeta}>
          {nameValue.length}/{REVIEW_NAME_MAX}
        </p>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>כותרת הביקורת</span>
        <input
          className={styles.input}
          maxLength={REVIEW_TITLE_MAX}
          {...register("title")}
        />
        {errors.title ? (
          <p className={styles.fieldError}>{errors.title.message}</p>
        ) : null}
        <p className={styles.charMeta}>
          {titleValue.length}/{REVIEW_TITLE_MAX}
        </p>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>דירוג</span>
        <Controller
          name="rating"
          control={control}
          render={({ field }) => (
            <AppSelect
              id="rating"
              name={field.name}
              className={styles.select}
              ariaLabel="דירוג"
              value={String(field.value ?? "")}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              options={ratingOptions}
              placeholder="בחרו דירוג"
            />
          )}
        />
        {errors.rating ? (
          <p className={styles.fieldError}>{errors.rating.message}</p>
        ) : null}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>תגובה</span>
        <textarea
          className={styles.textarea}
          rows={6}
          maxLength={REVIEW_COMMENT_MAX}
          {...register("comment")}
        />
        {errors.comment ? (
          <p className={styles.fieldError}>{errors.comment.message}</p>
        ) : null}
        <p className={styles.charMeta}>
          {commentValue.length}/{REVIEW_COMMENT_MAX}
        </p>
      </label>

      {serverError ? <p className={styles.fieldError}>{serverError}</p> : null}
      <div aria-live="polite" aria-atomic="true">
        {success ? (
          <div className={styles.successBanner} role="status">
            <span className={styles.successIcon} aria-hidden="true">
              ✓
            </span>
            <div>
              <p className={styles.successTitle}>הביקורת נשלחה בהצלחה</p>
              <p className={styles.successSubtitle}>
                מעבירים אותך לעמוד ההצגה...
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className={styles.actions}>
        <button
          className={styles.primaryBtn}
          type="submit"
          disabled={isSubmitting || success}
        >
          {isSubmitting ? (
            <>
              <span className={styles.submitSpinner} aria-hidden="true" />
              <span>שולחים...</span>
            </>
          ) : success ? (
            "נשלח"
          ) : (
            "שליחת ביקורת"
          )}
        </button>
      </div>
    </form>
  );
}
