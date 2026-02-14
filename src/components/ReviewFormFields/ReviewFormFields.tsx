"use client";

import { Controller } from "react-hook-form";
import type { Control, UseFormRegister } from "react-hook-form";
import AppSelect from "@/components/AppSelect/AppSelect";
import {
  REVIEW_TEXT_MAX,
  REVIEW_TITLE_MAX,
} from "@/constants/reviewValidation";
import { ratingOptions } from "@/lib/reviewSchemas";
import styles from "./ReviewFormFields.module.css";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface ReviewFormFieldsProps {
  /** react-hook-form register function */
  register: UseFormRegister<any>;
  /** react-hook-form control object */
  control: Control<any>;
  /** Validation errors for the three fields */
  errors: Record<string, { message?: string } | undefined>;
  /** Current title value (for character counter) */
  titleValue: string;
  /** Current text value (for character counter) */
  textValue: string;
  /** Number of textarea rows (default 6) */
  textRows?: number;
  /** Whether all fields should be disabled */
  disabled?: boolean;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Shared title / rating / text fields used by both
 * the create-review and edit-review forms.
 */
export default function ReviewFormFields({
  register,
  control,
  errors,
  titleValue,
  textValue,
  textRows = 6,
  disabled,
}: ReviewFormFieldsProps) {
  return (
    <>
      <label className={styles.field}>
        <span className={styles.label}>כותרת הביקורת</span>
        <input
          className={styles.input}
          maxLength={REVIEW_TITLE_MAX}
          disabled={disabled}
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
              disabled={disabled}
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
          rows={textRows}
          maxLength={REVIEW_TEXT_MAX}
          disabled={disabled}
          {...register("text")}
        />
        {errors.text ? (
          <p className={styles.fieldError}>{errors.text.message}</p>
        ) : null}
        <p className={styles.charMeta}>
          {textValue.length}/{REVIEW_TEXT_MAX}
        </p>
      </label>
    </>
  );
}
