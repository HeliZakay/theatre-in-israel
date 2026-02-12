"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import ROUTES from "@/constants/routes";
import AppSelect from "@/components/AppSelect/AppSelect";
import {
  REVIEW_COMMENT_MAX,
  REVIEW_COMMENT_MIN,
  REVIEW_TITLE_MAX,
  REVIEW_TITLE_MIN,
} from "@/constants/reviewValidation";
import styles from "./page.module.css";

const editReviewSchema = z.object({
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

interface EditReviewFormProps {
  reviewId: number;
  showId: number;
  initialTitle: string;
  initialRating: number;
  initialComment: string;
}

export default function EditReviewForm({
  reviewId,
  showId,
  initialTitle,
  initialRating,
  initialComment,
}: EditReviewFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(editReviewSchema),
    defaultValues: {
      title: initialTitle,
      rating: String(initialRating),
      comment: initialComment,
    },
  });

  const titleValue = useWatch({ control, name: "title" }) ?? "";
  const commentValue = useWatch({ control, name: "comment" }) ?? "";

  const onSubmit = async (values: z.infer<typeof editReviewSchema>) => {
    setServerError("");
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setServerError(json?.error || "לא הצלחנו לעדכן את הביקורת");
        return;
      }

      router.push(ROUTES.MY_REVIEWS);
      router.refresh();
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
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
          rows={7}
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

      <div className={styles.actions}>
        <button className={styles.primaryBtn} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "שומרים..." : "שמירת שינויים"}
        </button>
        <Link className={styles.ghostBtn} href={ROUTES.MY_REVIEWS}>
          ביטול
        </Link>
        <Link className={styles.ghostBtn} href={`${ROUTES.SHOWS}/${showId}`}>
          לדף ההצגה
        </Link>
      </div>
    </form>
  );
}
