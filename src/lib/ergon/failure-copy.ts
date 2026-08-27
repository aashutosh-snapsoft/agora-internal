/** User-facing copy for known Ergon failure codes. */
export const FAILURE_COPY: Record<string, string> = {
  ERGON_UNAVAILABLE: 'Our compute cluster is starting up. Please try again in a moment.',
};

/** Fallback copy when no code-keyed message is available. */
export const GENERIC_FAILURE_COPY = "We couldn't start processing your document. Please try again.";
