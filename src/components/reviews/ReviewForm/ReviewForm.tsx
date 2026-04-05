"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import styles from "./ReviewForm.module.css";
import fieldStyles from "@/components/reviews/ReviewFormFields/ReviewFormFields.module.css";
import { createReview, createAnonymousReview } from "@/app/reviews/actions";
import ShowCombobox from "@/components/shows/ShowCombobox/ShowCombobox";
import ReviewFormFields from "@/components/reviews/ReviewFormFields/ReviewFormFields";
import {
  clientReviewSchema,
  clientAnonymousReviewSchema,
} from "@/lib/reviewSchemas";
import FallbackImage from "@/components/ui/FallbackImage/FallbackImage";
import { getShowImagePath } from "@/utils/getShowImagePath";
import { REVIEW_NAME_MAX } from "@/constants/reviewValidation";
import ROUTES from "@/constants/routes";
import type { Show } from "@/types";

/** Raw form field values before Zod transformation (rating is a string in the form). */
interface ReviewFormValues {
  showId: string;
  title: string;
  rating: string;
  text: string;
  name: string;
  honeypot: string;
}

/** Minimal show data needed for the combobox + poster. */
export type ShowOption = Pick<Show, "id" | "slug" | "title">;

interface ReviewFormProps {
  shows?: ShowOption[];
  initialShowId?: number | string;
  initialShowSlug?: string;
  isAuthenticated?: boolean;
}

export default function ReviewForm({
  shows = [],
  initialShowId = "",
  initialShowSlug = "",
  isAuthenticated = true,
}: ReviewFormProps) {
  const isAnonymous = !isAuthenticated;
  const router = useRouter();
  const pathname = usePathname();
  const [serverError, setServerError] = useState("");

  const schema = isAuthenticated
    ? clientReviewSchema
    : clientAnonymousReviewSchema;

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<ReviewFormValues>,
    defaultValues: {
      showId: String(initialShowId ?? ""),
      title: "",
      rating: "",
      text: "",
      name: "",
      honeypot: "",
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

  const onSubmit = async (values: ReviewFormValues) => {
    setServerError("");
    try {
      const formData = new FormData();
      formData.set("showId", String(values.showId));
      formData.set("title", String(values.title));
      formData.set("rating", String(values.rating));
      formData.set("text", String(values.text));

      if (!isAuthenticated) {
        formData.set("name", String(values.name ?? ""));
        formData.set("honeypot", String(values.honeypot ?? ""));
      }

      const action = isAuthenticated ? createReview : createAnonymousReview;
      const result = await action(formData);

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      const reviewCount = result.data.reviewCount;
      const slug =
        shows.find((s) => String(s.id) === String(values.showId))?.slug ??
        initialShowSlug;
      router.push(`/shows/${slug}?review=success&count=${reviewCount}`);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : String(err));
    }
  };

  const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(onSubmit)(e);
  };

  const form = (
    <form className={styles.form} onSubmit={submitHandler} noValidate>
      {isAnonymous && (
        <div className={styles.signInBanner}>
          <span className={styles.signInBannerIcon} aria-hidden="true">
            ℹ️
          </span>
          <p>
            יש לך חשבון?{" "}
            <Link
              href={`${ROUTES.AUTH_SIGNIN}?callbackUrl=${encodeURIComponent(pathname)}`}
            >
              התחבר.י
            </Link>{" "}
            כדי לערוך ביקורות בעתיד
          </p>
        </div>
      )}

      {shows.length ? (
        <label className={fieldStyles.field}>
          <span className={fieldStyles.label}>הצגה</span>
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
            <p
              id="showId-error"
              className={fieldStyles.fieldError}
              role="alert"
            >
              {errors.showId.message}
            </p>
          ) : null}
        </label>
      ) : (
        <input type="hidden" {...register("showId")} />
      )}

      {!isAuthenticated && (
        <>
          <label className={fieldStyles.field}>
            <span className={fieldStyles.label}>שם (לא חובה)</span>
            <input
              className={fieldStyles.input}
              type="text"
              placeholder="אנונימי"
              maxLength={REVIEW_NAME_MAX}
              disabled={isSubmitting}
              {...register("name")}
            />
            {errors.name ? (
              <p className={fieldStyles.fieldError} role="alert">
                {errors.name.message}
              </p>
            ) : null}
          </label>

          {/* Honeypot field — hidden from real users, filled by bots */}
          <div className={styles.honeypot} aria-hidden="true">
            <label>
              <span>Leave this empty</span>
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                {...register("honeypot")}
              />
            </label>
          </div>
        </>
      )}

      <ReviewFormFields
        register={register}
        control={control}
        errors={errors}
        titleValue={titleValue}
        textValue={textValue}
        disabled={isSubmitting}
      />

      {serverError ? (
        <p className={fieldStyles.fieldError}>{serverError}</p>
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
            "שלח.י ביקורת"
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
