"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import styles from "./InlineReviewForm.module.css";
import fieldStyles from "@/components/ReviewFormFields/ReviewFormFields.module.css";
import Card from "@/components/Card/Card";
import StarRating from "@/components/StarRating/StarRating";
import ReviewSuccessBanner from "@/components/ReviewSuccessBanner/ReviewSuccessBanner";
import ReviewFormFields from "@/components/ReviewFormFields/ReviewFormFields";
import { createReview, createAnonymousReview } from "@/app/reviews/actions";
import {
  clientReviewSchema,
  clientAnonymousReviewSchema,
} from "@/lib/reviewSchemas";
import { REVIEW_NAME_MAX } from "@/constants/reviewValidation";
import ROUTES from "@/constants/routes";
import { cx } from "@/utils/cx";

interface SubmittedReview {
  rating: number;
  title: string;
  text: string;
}

interface InlineReviewFormProps {
  showId: number;
  showSlug: string;
  showTitle: string;
  isAuthenticated: boolean;
  /** Controls the prompt text */
  variant: "empty" | "after-reviews";
}

export default function InlineReviewForm({
  showId,
  showSlug,
  showTitle,
  isAuthenticated,
  variant,
}: InlineReviewFormProps) {
  const isAnonymous = !isAuthenticated;
  const pathname = usePathname();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submittedReview, setSubmittedReview] =
    useState<SubmittedReview | null>(null);
  const [reviewCount, setReviewCount] = useState<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const schema = isAuthenticated
    ? clientReviewSchema
    : clientAnonymousReviewSchema;

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      showId: String(showId),
      title: "",
      rating: "",
      text: "",
      ...(isAnonymous ? { name: "", honeypot: "" } : {}),
    },
  });

  const ratingValue = useWatch({ control, name: "rating" });
  const titleValue = useWatch({ control, name: "title" }) ?? "";
  const textValue = useWatch({ control, name: "text" }) ?? "";
  const ratingError = errors.rating as { message?: string } | undefined;

  const handleStarChange = useCallback(
    (starValue: number) => {
      setValue("rating", String(starValue), { shouldValidate: true });
      if (!isExpanded) {
        setIsExpanded(true);
      }
    },
    [setValue, isExpanded],
  );

  const handleCancel = useCallback(() => {
    setIsExpanded(false);
    setServerError("");
    setSubmittedReview(null);
    setReviewCount(null);
    reset({
      showId: String(showId),
      title: "",
      rating: "",
      text: "",
      ...(isAnonymous ? { name: "", honeypot: "" } : {}),
    });
  }, [reset, showId, isAnonymous]);

  const onSubmit = async (values: Record<string, unknown>) => {
    setServerError("");
    try {
      const formData = new FormData();
      formData.set("showId", String(values.showId));
      formData.set("title", String(values.title));
      formData.set("rating", String(values.rating));
      formData.set("text", String(values.text));

      if (isAnonymous) {
        formData.set("name", String(values.name ?? ""));
        formData.set("honeypot", String(values.honeypot ?? ""));
      }

      const action = isAuthenticated ? createReview : createAnonymousReview;
      const result = await action(formData);

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      const resultReviewCount =
        "reviewCount" in result.data &&
        typeof result.data.reviewCount === "number"
          ? result.data.reviewCount
          : null;

      if (isAuthenticated) {
        // Navigate with search param so the server-rendered banner survives revalidation
        const params = new URLSearchParams();
        params.set("review", "success");
        if (resultReviewCount !== null) {
          params.set("count", String(resultReviewCount));
        }
        router.replace(`/shows/${showSlug}?${params.toString()}`, {
          scroll: false,
        });
        return;
      }

      // Anonymous users: keep local success state (form stays mounted)
      setSubmittedReview({
        rating: Number(values.rating),
        title: String(values.title),
        text: String(values.text),
      });

      if (resultReviewCount !== null) {
        setReviewCount(resultReviewCount);
      }

      setSuccess(true);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : String(err));
    }
  };

  const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(onSubmit)(e);
  };

  const numericRating = ratingValue ? parseInt(String(ratingValue), 10) : null;

  if (success && submittedReview) {
    return (
      <ReviewSuccessBanner
        showSlug={showSlug}
        reviewCount={reviewCount}
        review={submittedReview}
        cleanUrl={false}
        id="write-review"
      />
    );
  }

  return (
    <Card className={styles.card} id="write-review">
      <h3 className={styles.prompt}>
        {variant === "empty"
          ? "היו הראשונים לכתוב ביקורת!"
          : "ראיתם את ההצגה? ספרו מה חשבתם"}
      </h3>
      {!isExpanded && (
        <p className={styles.subtitle}>
          {variant === "empty"
            ? "כל מילה שלכם שווה זהב — גם משפט אחד עוזר לאחרים להחליט."
            : "הדעה שלכם חשובה לנו ולקהילה 🎭"}
        </p>
      )}

      <div className={styles.ratingRow}>
        <StarRating
          value={numericRating && numericRating >= 1 ? numericRating : null}
          onChange={handleStarChange}
          disabled={isSubmitting}
        />
        {!isExpanded && (
          <span className={styles.ratingLabel}>לחצו על כוכב כדי להתחיל</span>
        )}
        {isExpanded && ratingError && (
          <p className={styles.ratingError}>{ratingError.message}</p>
        )}
      </div>

      <div
        className={cx(styles.expandWrapper, isExpanded && styles.expanded)}
        aria-hidden={!isExpanded}
      >
        <div className={styles.expandInner}>
          <form
            ref={formRef}
            className={styles.form}
            onSubmit={submitHandler}
            noValidate
          >
            <input type="hidden" {...register("showId")} />

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

            {isAnonymous && (
              <>
                <label className={fieldStyles.field}>
                  <span className={fieldStyles.label}>שם (לא חובה)</span>
                  <input
                    className={fieldStyles.input}
                    type="text"
                    placeholder="אנונימי"
                    maxLength={REVIEW_NAME_MAX}
                    disabled={isSubmitting}
                    {...(register as Function)("name")}
                  />
                  {(errors as Record<string, { message?: string }>).name && (
                    <p className={fieldStyles.fieldError} role="alert">
                      {
                        (errors as Record<string, { message?: string }>).name
                          ?.message
                      }
                    </p>
                  )}
                </label>

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
              textRows={4}
              disabled={isSubmitting}
              hideRating
            />

            {serverError && (
              <p className={fieldStyles.fieldError}>{serverError}</p>
            )}

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
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      </div>
    </Card>
  );
}
