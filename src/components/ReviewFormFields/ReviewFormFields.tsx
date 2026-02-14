"use client";

import { Controller } from "react-hook-form";
import type {
  Control,
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
} from "react-hook-form";
import AppSelect from "@/components/AppSelect/AppSelect";
import {
  REVIEW_TEXT_MAX,
  REVIEW_TITLE_MAX,
} from "@/constants/reviewValidation";
import { ratingOptions } from "@/lib/reviewSchemas";
import styles from "./ReviewFormFields.module.css";

interface ReviewFormFieldsProps<TFieldValues extends FieldValues> {
  /** react-hook-form register function */
  register: UseFormRegister<TFieldValues>;
  /** react-hook-form control object */
  control: Control<TFieldValues>;
  /** Validation errors for the three fields */
  errors: FieldErrors<TFieldValues>;
  /** Current title value (for character counter) */
  titleValue: string;
  /** Current text value (for character counter) */
  textValue: string;
  /** Number of textarea rows (default 6) */
  textRows?: number;
  /** Whether all fields should be disabled */
  disabled?: boolean;
}

/**
 * Shared title / rating / text fields used by both
 * the create-review and edit-review forms.
 */
export default function ReviewFormFields<TFieldValues extends FieldValues>({
  register,
  control,
  errors,
  titleValue,
  textValue,
  textRows = 6,
  disabled,
}: ReviewFormFieldsProps<TFieldValues>) {
  const titleError = errors.title as { message?: string } | undefined;
  const ratingError = errors.rating as { message?: string } | undefined;
  const textError = errors.text as { message?: string } | undefined;

  return (
    <>
      <label className={styles.field}>
        <span className={styles.label}>כותרת הביקורת</span>
        <input
          className={styles.input}
          maxLength={REVIEW_TITLE_MAX}
          disabled={disabled}
          {...register("title" as Path<TFieldValues>)}
        />
        {titleError ? (
          <p className={styles.fieldError}>{titleError.message}</p>
        ) : null}
        <p className={styles.charMeta}>
          {titleValue.length}/{REVIEW_TITLE_MAX}
        </p>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>דירוג</span>
        <Controller
          name={"rating" as Path<TFieldValues>}
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
              disabled={disabled}
            />
          )}
        />
        {ratingError ? (
          <p className={styles.fieldError}>{ratingError.message}</p>
        ) : null}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>תגובה</span>
        <textarea
          className={styles.textarea}
          rows={textRows}
          maxLength={REVIEW_TEXT_MAX}
          disabled={disabled}
          {...register("text" as Path<TFieldValues>)}
        />
        {textError ? (
          <p className={styles.fieldError}>{textError.message}</p>
        ) : null}
        <p className={styles.charMeta}>
          {textValue.length}/{REVIEW_TEXT_MAX}
        </p>
      </label>
    </>
  );
}
