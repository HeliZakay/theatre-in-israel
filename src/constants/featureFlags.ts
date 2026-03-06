/**
 * Feature flags for toggling behaviors without code deletion.
 *
 * When a flag is `false` the associated feature is disabled;
 * set it back to `true` to re-enable.
 */

/**
 * When `true`, logged-out users see a gateway screen asking them to
 * sign-up / sign-in before writing a review (with an option to continue
 * as guest).  When `false`, they go straight to the review form.
 */
export const ENABLE_REVIEW_AUTH_GATEWAY = false;
