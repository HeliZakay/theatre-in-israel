"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type * as z from "zod";
import ROUTES from "@/constants/routes";
import { updateReview } from "@/app/reviews/actions";
import ReviewFormFields from "@/components/ReviewFormFields/ReviewFormFields";
import { clientEditReviewSchema } from "@/lib/reviewSchemas";
import styles from "./page.module.css";

interface EditReviewFormProps {
  reviewId: number;
  showSlug: string;
  initialTitle: string;
  initialRating: number;
  initialText: string;
}

export default function EditReviewForm({
  reviewId,
  showSlug,
  initialTitle,
  initialRating,
  initialText,
}: EditReviewFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(clientEditReviewSchema),
    defaultValues: {
      title: initialTitle,
      rating: String(initialRating),
      text: initialText,
    },
  });

  const titleValue = useWatch({ control, name: "title" }) ?? "";
  const textValue = useWatch({ control, name: "text" }) ?? "";

  const onSubmit = async (values: z.infer<typeof clientEditReviewSchema>) => {
    setServerError("");
    try {
      const result = await updateReview(reviewId, {
        title: values.title,
        rating: Number(values.rating),
        text: values.text,
      });

      if (!result.success) {
        setServerError(result.error);
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
      <ReviewFormFields
        register={register}
        control={control}
        errors={errors}
        titleValue={titleValue}
        textValue={textValue}
        textRows={7}
        disabled={isSubmitting}
      />

      {serverError ? <p className={styles.fieldError}>{serverError}</p> : null}

      <div className={styles.actions}>
        <button
          className={styles.primaryBtn}
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "שומרים..." : "שמירת שינויים"}
        </button>
        <Link className={styles.ghostBtn} href={ROUTES.MY_REVIEWS}>
          ביטול
        </Link>
        <Link className={styles.ghostBtn} href={`${ROUTES.SHOWS}/${showSlug}`}>
          לדף ההצגה
        </Link>
      </div>
    </form>
  );
}
