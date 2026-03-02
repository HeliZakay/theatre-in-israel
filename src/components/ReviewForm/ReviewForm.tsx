"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type * as z from "zod";
import styles from "./ReviewForm.module.css";
import fieldStyles from "@/components/ReviewFormFields/ReviewFormFields.module.css";
import { createReview, createAnonymousReview } from "@/app/reviews/actions";
import ShowCombobox from "@/components/ShowCombobox/ShowCombobox";
import ReviewFormFields from "@/components/ReviewFormFields/ReviewFormFields";
import ShareButtons from "@/components/ShareButtons/ShareButtons";
import {
  clientReviewSchema,
  clientAnonymousReviewSchema,
} from "@/lib/reviewSchemas";
import FallbackImage from "@/components/FallbackImage/FallbackImage";
import { getShowImagePath } from "@/utils/getShowImagePath";
import { REVIEW_NAME_MAX } from "@/constants/reviewValidation";
import { isLotteryActive } from "@/constants/lottery";
import ROUTES from "@/constants/routes";
import type { Show } from "@/types";

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
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const [lotteryEntries, setLotteryEntries] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schema = isAuthenticated
    ? clientReviewSchema
    : clientAnonymousReviewSchema;

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      showId: String(initialShowId ?? ""),
      title: "",
      rating: "",
      text: "",
      ...(isAuthenticated ? {} : { name: "", honeypot: "" }),
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

  const onSubmit = async (values: Record<string, unknown>) => {
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

      // Store lottery entries if returned (authenticated + lottery active)
      if (
        result.success &&
        "lotteryEntries" in result.data &&
        typeof result.data.lotteryEntries === "number"
      ) {
        setLotteryEntries(result.data.lotteryEntries);
      }

      // Show inline success and navigate after a short delay
      // Longer timeout for authenticated reviews when lottery is active to allow sharing
      setSuccess(true);
      timerRef.current = setTimeout(
        () => {
          const slug =
            shows.find((s) => String(s.id) === String(values.showId))?.slug ??
            initialShowSlug;
          router.push(`/shows/${slug}`);
        },
        !isAnonymous && isLotteryActive() ? 4000 : 1800,
      );
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : String(err));
    }
  };

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
              disabled={isSubmitting || success}
              {...(register as Function)("name")}
            />
            {(errors as Record<string, { message?: string }>).name ? (
              <p className={fieldStyles.fieldError} role="alert">
                {(errors as Record<string, { message?: string }>).name?.message}
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
                {...(register as Function)("honeypot")}
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
        disabled={isSubmitting || success}
      />

      {serverError ? (
        <p className={fieldStyles.fieldError}>{serverError}</p>
      ) : null}
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
        {success &&
        !isAnonymous &&
        isLotteryActive() &&
        lotteryEntries !== null ? (
          <div className={styles.lotterySection}>
            <p className={styles.lotteryTitle}>🎟️ קיבלת כרטיס להגרלה!</p>
            <p className={styles.lotteryCount}>
              יש לך {lotteryEntries} כרטיס{lotteryEntries === 1 ? "" : "ים"}{" "}
              להגרלה
            </p>
            <div className={styles.lotteryShare}>
              <ShareButtons
                text="כתבתי ביקורת באתר תיאטרון בישראל והשתתפתי בהגרלה לזוג כרטיסים! כתבו גם אתם 🎭"
                url={
                  typeof window !== "undefined" ? window.location.origin : "/"
                }
              />
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
            "שלח.י ביקורת"
          )}
        </button>
      </div>

      {!isAuthenticated && (
        <p className={styles.signInHint}>
          יש לך חשבון? <Link href={ROUTES.AUTH_SIGNIN}>התחבר.י</Link> כדי לערוך
          ביקורות בעתיד
        </p>
      )}
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
