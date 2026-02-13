"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type * as z from "zod";
import ROUTES from "@/constants/routes";
import ReviewFormFields from "@/components/ReviewFormFields/ReviewFormFields";
import { clientEditReviewSchema } from "@/constants/reviewSchemas";
import styles from "./page.module.css";

interface EditReviewFormProps {
  reviewId: number;
  showId: number;
  initialTitle: string;
  initialRating: number;
  initialText: string;
}

export default function EditReviewForm({
  reviewId,
  showId,
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
        <Link className={styles.ghostBtn} href={`${ROUTES.SHOWS}/${showId}`}>
          לדף ההצגה
        </Link>
      </div>
    </form>
  );
}
