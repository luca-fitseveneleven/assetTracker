/**
 * Deployment mode detection.
 *
 * Set SELF_HOSTED=true in env to disable SaaS-specific features:
 * - Quota enforcement (unlimited assets/users)
 * - Org suspension / grace period
 * - Billing / Stripe integration
 *
 * Org scoping remains active in both modes (harmless for single-tenant,
 * keeps data structured correctly for potential future migration to SaaS).
 */
export function isSelfHosted(): boolean {
  return process.env.SELF_HOSTED === "true";
}
