/**
 * Centralized user-facing alert and error copy for the app.
 * Use these keys wherever an alert, error banner, or popup message is shown.
 *
 * Usage:
 *   import { ALERT_MESSAGES, getTooManyUploadAttemptsMessage } from "@/lib/content/alert-messages";
 *   <Alert severity={ALERT_MESSAGES.UPLOAD_INTERRUPTED.severity}>
 *     <Typography>{ALERT_MESSAGES.UPLOAD_INTERRUPTED.title}</Typography>
 *     <Typography variant="body2">{ALERT_MESSAGES.UPLOAD_INTERRUPTED.message}</Typography>
 *   </Alert>
 *   setExportError(ALERT_MESSAGES.EXPORT_PROJECT_ID_MISSING.message);
 */

export type AlertSeverity = "error" | "info" | "success" | "warning";

export interface AlertMessage {
  title: string;
  message: string;
  severity: AlertSeverity;
}

export const ALERT_MESSAGES: Record<string, AlertMessage> = {
  // --- Upload / project creation ---
  UPLOAD_INTERRUPTED: {
    title: "Upload interrupted",
    message:
      "We couldn't upload your file, so no data was processed. Please try uploading it again.",
    severity: "warning",
  },
  UPLOAD_NOT_SUCCESSFUL: {
    title: "Upload wasn't successful",
    message:
      "Please delete this project, create a new project, and upload your files again to proceed.",
    severity: "error",
  },
  PROCESSING_FAILED_TRY_AGAIN: {
    title: "Processing failed",
    message: "Processing failed. Please try again.",
    severity: "error",
  },
  /** Shown when upload or processing fails or document requirements are not met; prompts user to retry or start a new project. */
  PROCESSING_FAILED_START_NEW: {
    title: "Processing issue detected",
    message:
      "We encountered an issue while processing your upload. You can try uploading again, or if the problem persists, create a new project.",
    severity: "error",
  },
  UPLOAD_FAILED_TRY_AGAIN: {
    title: "Upload failed",
    message: "Upload failed. Please try again.",
    severity: "error",
  },
  UNEXPECTED_ERROR_TRY_AGAIN: {
    title: "Something went wrong",
    message: "An unexpected error occurred. Please try again.",
    severity: "error",
  },
  FILE_VALIDATION_FAILED: {
    title: "File validation failed",
    message: "File validation failed",
    severity: "error",
  },
  FAILED_TO_GET_PROJECT_ID: {
    title: "Error",
    message: "Failed to get project ID. Please try again.",
    severity: "error",
  },
  PROJECT_CREATION_FAILED: {
    title: "Project creation failed",
    message: "Project creation failed.",
    severity: "error",
  },
  AUTH_SESSION_EXPIRED: {
    title: "Authentication error",
    message:
      "Your session may have expired.\n\nPlease try:\n1. Logging out and logging back in\n2. Refreshing the page\n3. If the problem persists, contact support",
    severity: "error",
  },
  NETWORK_ERROR_CREATE_PROJECT: {
    title: "Network error",
    message:
      "Unable to create project. This may be due to:\n1. Server connectivity - Ensure the backend server is running and accessible\n2. Network issues - Check your internet connection\n\nPlease contact support if the issue persists.",
    severity: "error",
  },
  NETWORK_ERROR_CONNECT_SERVER: {
    title: "Network error",
    message:
      "Unable to connect to the server. This may be due to:\n1. Server connectivity - Ensure the backend server is running and accessible\n2. Network issues - Check your internet connection\n\nPlease contact support if the issue persists.",
    severity: "error",
  },

  // --- Document list / processing status ---
  DOCUMENT_NOT_PROCESSED: {
    title: "File not processed",
    message: "This file was not processed successfully. Please try again.",
    severity: "error",
  },
  DOCUMENT_FAILED_TO_PROCESS: {
    title: "Processing failed",
    message: "This file failed to process. Please try again.",
    severity: "error",
  },

  // --- Support / contact ---
  SUPPORT_FORM_OPEN_FAILED: {
    title: "Unable to open form",
    message:
      "Unable to open support form. Please try again or email support@socratics.ai",
    severity: "error",
  },
  SUPPORT_MESSAGE_SENT: {
    title: "Message sent",
    message: "Your message has been sent successfully!",
    severity: "success",
  },
  SUPPORT_SEND_FAILED: {
    title: "Send failed",
    message: "Failed to send message. Please try again.",
    severity: "error",
  },

  // --- Sync / revisions ---
  SYNC_MISSING_ASSUMPTIONS: {
    title: "Missing assumptions",
    message:
      "You are currently missing some user assumptions for forecast drivers. Please review 'Assumptions Needed' in Financials > Forecast Drivers column.",
    severity: "error",
  },
  SYNC_FORECAST_DRIVER_CHANGES: {
    title: "Sync issue",
    message:
      "Some forecast driver changes could not be synced. Please check your forecast driver settings and try again.",
    severity: "error",
  },
  SYNC_FAILED_TRY_AGAIN: {
    title: "Sync failed",
    message:
      "Failed to sync build revisions. Please try again. If the problem persists, please contact support.",
    severity: "error",
  },
  SYNC_FAILED_REVIEW_CHANGES: {
    title: "Sync failed",
    message:
      "Failed to sync build revisions. Some changes may not have been applied. Please review your changes and try again. If the problem persists, please contact support.",
    severity: "error",
  },

  // --- Export ---
  EXPORT_PROJECT_ID_MISSING: {
    title: "Export error",
    message: "Project ID is missing. Please try again.",
    severity: "error",
  },
  EXPORT_NOT_CONFIGURED: {
    title: "Export not configured",
    message:
      "Export service is not configured. Please check that NEXT_PUBLIC_LOGOS_URL is set in your environment variables.",
    severity: "error",
  },
  EXPORT_CORS_NETWORK: {
    title: "Export failed",
    message:
      "Export failed due to CORS or network error.\n\nThis is likely a local environment issue. Please check:\n• Is the logos service running? (Check if NEXT_PUBLIC_LOGOS_URL is accessible)\n• Is CORS properly configured on the logos service?\n• Check the browser console for detailed error messages",
    severity: "error",
  },
  EXPORT_NETWORK: {
    title: "Export failed",
    message:
      "Export failed due to network error.\n\nPlease check:\n• Is the logos service running?\n• Check your network connection",
    severity: "error",
  },
  EXPORT_NOT_CONFIGURED_ENV: {
    title: "Export not configured",
    message:
      "Export service is not configured.\n\nPlease set NEXT_PUBLIC_LOGOS_URL in your .env.local file.\nExample: NEXT_PUBLIC_LOGOS_URL=http://localhost:8000\n\nAfter setting it, restart your development server.",
    severity: "error",
  },
  EXPORT_TIMED_OUT: {
    title: "Export timed out",
    message:
      "Export request timed out.\n\nThe export service may be slow or unresponsive. Please try again.",
    severity: "error",
  },
  EXPORT_FAILED_GENERIC: {
    title: "Export failed",
    message:
      "Export failed. This could be due to:\n• Network connectivity issues\n• Server temporarily unavailable\n• Authentication session expired\n\nPlease check your connection and try again. If the problem persists, refresh the page.",
    severity: "error",
  },
  EXPORT_AUTH_FAILED: {
    title: "Authentication failed",
    message: "Authentication failed. Please refresh the page and try again.",
    severity: "error",
  },
  EXPORT_PROJECT_NOT_FOUND: {
    title: "Project not found",
    message: "Project not found. Please try again or contact support.",
    severity: "error",
  },
  EXPORT_SERVER_ERROR: {
    title: "Server error",
    message: "Server error. Please try again in a few moments.",
    severity: "error",
  },
  EXPORT_UNEXPECTED: {
    title: "Export error",
    message: "An unexpected error occurred during export. Please try again.",
    severity: "error",
  },

  // --- Auth / login / verify email ---
  LOGIN_ERROR_TITLE: {
    title: "Login Error",
    message: "Login Error",
    severity: "error",
  },
  AUTH_FAILED_TRY_AGAIN: {
    title: "Authentication failed",
    message: "Authentication failed. Please try again.",
    severity: "error",
  },
  LOGIN_CONTACT_SUPPORT: {
    title: "Need help?",
    message:
      "If you continue to experience issues, please contact our support team.",
    severity: "info",
  },
  VERIFY_EMAIL_UNVERIFIED: {
    title: "Email not verified",
    message:
      "Your email address has not been verified. For security, please verify your email before logging in.",
    severity: "warning",
  },
  VERIFY_EMAIL_SENT: {
    title: "Verification email sent",
    message: "We've sent a verification link to your email address.",
    severity: "info",
  },
  VERIFY_EMAIL_CHECK_INBOX: {
    title: "Check your email",
    message:
      "Please check your email (including spam folder) and click the verification link.",
    severity: "info",
  },
  VERIFY_EMAIL_AFTER: {
    title: "After verification",
    message: "After verification, you can log in again.",
    severity: "info",
  },
};

/** Button label for processing-failed alert: start a new project */
export const PROCESSING_FAILED_START_NEW_CTA = "Create new project";

/** Dynamic message: rate limit for uploads */
export function getTooManyUploadAttemptsMessage(seconds: number): string {
  return `Too many upload attempts. Please wait ${seconds} seconds before trying again.`;
}

/** Dynamic message: export failed with HTTP status code */
export function getExportFailedWithCodeMessage(statusCode: string): string {
  return `Export failed with error code ${statusCode}. Please try again.`;
}

/** Dynamic message: export CORS/network with current logos URL (for display) */
export function getExportCorsMessageWithUrl(logosUrl: string): string {
  return `${ALERT_MESSAGES.EXPORT_CORS_NETWORK.message}\n\nCurrent logos_url: ${logosUrl}`;
}

/** Dynamic message: export network error with service URL */
export function getExportNetworkMessageWithUrl(serviceUrl: string): string {
  return `${ALERT_MESSAGES.EXPORT_NETWORK.message}\n• Is the service accessible at: ${serviceUrl}`;
}

/** Dynamic message: export failed generic with error details appended */
export function getExportFailedGenericWithDetails(errorDetails: string): string {
  return `${ALERT_MESSAGES.EXPORT_FAILED_GENERIC.message}\n\nError details: ${errorDetails}`;
}

/** Dynamic message: document Excel format issue with details */
export function getDocumentExcelFormatMessage(details: string): string {
  return `This file was detected as an Excel file but did not appear to follow the expected Yoshi Standard format. ${details}. Please try again.`;
}

/** Dynamic message: project creation failed with error details */
export function getProjectCreationFailedMessage(errorMessage: string): string {
  return `Project creation failed: ${errorMessage}`;
}

/** Get alert copy by key */
export function getAlertMessage(key: keyof typeof ALERT_MESSAGES): AlertMessage {
  const value = ALERT_MESSAGES[key];
  if (!value) {
    throw new Error(`Unknown alert key: ${String(key)}`);
  }
  return value;
}
