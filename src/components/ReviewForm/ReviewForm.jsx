"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import styles from "@/app/reviews/new/page.module.css";
import ROUTES from "@/constants/routes";

const reviewSchema = z.object({
  showId: z.string().min(1, "יש לבחור הצגה"),
  name: z.string().min(2, "הכנס שם חוקי"),
  title: z.string().min(2, "הכנס כותרת"),
  rating: z.preprocess(
    (v) => (typeof v === "string" ? parseInt(v, 10) : v),
    z.number().int().min(1).max(5),
  ),
  comment: z.string().min(10, "תגובה צריכה להכיל לפחות 10 תווים"),
});

export default function ReviewForm({ shows = [], initialShowId = "" }) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const timerRef = useRef(null);

  const {
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

  const onSubmit = async (values) => {
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
      }, 1400);
    } catch (err) {
      setServerError(err?.message || String(err));
    }
  };

  // Wrap react-hook-form's `handleSubmit` so we don't call it during
  // render (some lint rules flag calling it directly in JSX). This
  // returns an event handler that will invoke the RHF submit logic.
  const submitHandler = (e) => {
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
      <div aria-live="polite" aria-atomic="true">
        {success ? (
          <p className={styles.success}>תודה! הביקורת נשלחה בהצלחה.</p>
        ) : null}
      </div>
      {shows.length ? (
        <label className={styles.field}>
          <span className={styles.label}>הצגה</span>
          <select className={styles.select} {...register("showId")}>
            <option value="" disabled>
              בחרו הצגה
            </option>
            {shows.map((show) => (
              <option key={show.id} value={show.id}>
                {show.title}
              </option>
            ))}
          </select>
          {errors.showId ? (
            <p className={styles.fieldError}>{errors.showId.message}</p>
          ) : null}
        </label>
      ) : (
        <input type="hidden" {...register("showId")} />
      )}

      <label className={styles.field}>
        <span className={styles.label}>שם מלא</span>
        <input className={styles.input} {...register("name")} />
        {errors.name ? (
          <p className={styles.fieldError}>{errors.name.message}</p>
        ) : null}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>כותרת הביקורת</span>
        <input className={styles.input} {...register("title")} />
        {errors.title ? (
          <p className={styles.fieldError}>{errors.title.message}</p>
        ) : null}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>דירוג</span>
        <select className={styles.select} {...register("rating")}>
          <option value="" disabled>
            בחרו דירוג
          </option>
          <option value="5">5 - מצוין</option>
          <option value="4">4 - טוב מאוד</option>
          <option value="3">3 - סביר</option>
          <option value="2">2 - פחות</option>
          <option value="1">1 - לא מומלץ</option>
        </select>
        {errors.rating ? (
          <p className={styles.fieldError}>{errors.rating.message}</p>
        ) : null}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>תגובה</span>
        <textarea
          className={styles.textarea}
          rows={6}
          {...register("comment")}
        />
        {errors.comment ? (
          <p className={styles.fieldError}>{errors.comment.message}</p>
        ) : null}
      </label>

      {serverError ? <p className={styles.fieldError}>{serverError}</p> : null}

      <div className={styles.actions}>
        <button
          className={styles.primaryBtn}
          type="submit"
          disabled={isSubmitting || success}
        >
          {success ? "נשלח" : "שליחת ביקורת"}
        </button>
      </div>
    </form>
  );
}
