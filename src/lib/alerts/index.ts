/**
 * Alert engine. The implementation lives in `@/lib/notifications`; this module
 * is kept as the documented entry point for alert dispatch.
 */
export {
  dispatchIncidentAlert,
  sendVerificationEmail,
  sendPasswordResetEmail,
  type IncidentEvent,
} from "@/lib/notifications";
