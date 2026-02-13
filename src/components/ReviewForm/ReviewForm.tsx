"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type * as z from "zod";
import styles from "./ReviewForm.module.css";
import ROUTES from "@/constants/routes";
import ShowCombobox from "@/components/ShowCombobox/ShowCombobox";
import ReviewFormFields from "@/components/ReviewFormFields/ReviewFormFields";
import { clientReviewSchema } from "@/constants/reviewSchemas";
import FallbackImage from "@/components/FallbackImage/FallbackImage";
import { getShowImagePath } from "@/utils/getShowImagePath";
import type { Show } from "@/types";

/** Minimal show data needed for the combobox + poster. */
export type ShowOption = Pick<Show, "id" | "title">;

interface ReviewFormProps {
  shows?: ShowOption[];
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
    resolver: zodResolver(clientReviewSchema),
    defaultValues: {
      showId: String(initialShowId ?? ""),
      title: "",
      rating: "",
      text: "",
    },
  });

  const showOptions = shows.map((show) => ({
    value: String(show.id),
    label: show.title,
  }));
  const selectedShowId = useWatch({ control, name: "showId" }) ?? "";
  const selectedShow =
    shows.find((show) => String(show.id) === String(selectedShowId)) ?? null;
  const titleValue = useWatch({ control, name: "title" }) ?? "";
  const textValue = useWatch({ control, name: "text" }) ?? "";

  const onSubmit = async (values: z.infer<typeof clientReviewSchema>) => {
    setServerError("");
    try {
      const formData = new FormData();
      formData.set("showId", String(values.showId));
      formData.set("title", values.title);
      formData.set("rating", String(values.rating));
      formData.set("text", values.text);

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

  const form = (
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

      <ReviewFormFields
        register={register}
        control={control}
        errors={errors}
        titleValue={titleValue}
        textValue={textValue}
        disabled={isSubmitting || success}
      />

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

  if (!selectedShow) {
    return form;
  }

  return (
    <section className={styles.contentLayout}>
      <aside
        className={styles.posterPanel}
        aria-label={`פוסטר של ${selectedShow.title}`}
      >
        <div className={styles.poster}>
          <FallbackImage
            src={getShowImagePath(selectedShow.title)}
            alt={selectedShow.title}
            fill
            sizes="(max-width: 900px) 100vw, 280px"
            className={styles.posterImage}
          />
        </div>
      </aside>

      <div className={styles.formWrap}>{form}</div>
    </section>
  );
}
