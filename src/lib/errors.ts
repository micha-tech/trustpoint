const errorMap: Record<string, string> = {
  "auth/id-token-expired": "Your session expired. Please sign in again.",
  "auth/user-not-found": "We couldn't find an account with those details.",
  "auth/wrong-password": "That password doesn't match. Try again or reset it.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/invalid-credential": "Those credentials don't match our records.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/requires-recent-login": "Please sign in again to continue.",
  "P2002": "A record with that value already exists.",
  "P2025": "The requested resource was not found.",
  "P2003": "This operation references a record that doesn't exist.",
  "PAYSTACK_INSUFFICIENT_BALANCE": "The payment couldn't be processed. Contact support.",
  "PAYSTACK_INVALID_AMOUNT": "Something went wrong with the payment amount.",
  "MILESTONE_ALREADY_APPROVED": "This milestone has already been approved.",
  "MILESTONE_NOT_COMPLETED": "This milestone hasn't been marked as complete yet.",
  "INVALID_SIGNATURE": "This link is invalid or has been tampered with.",
  "TOKEN_EXPIRED": "This link has expired. Please request a new one.",
  "ESCROW_INSUFFICIENT_FUNDS": "There aren't enough funds in escrow for this release.",
  "ESCROW_NOT_FUNDED": "The escrow hasn't been funded yet.",
  "NOT_FOUND": "We couldn't find what you're looking for.",
  "UNAUTHORIZED": "You don't have permission to do that.",
};

export function calmError(error: unknown): string {
  if (typeof error === "string") return errorMap[error] ?? error;

  if (error instanceof Error) {
    const msg = error.message;
    for (const [code, human] of Object.entries(errorMap)) {
      if (msg.includes(code)) return human;
    }
    return "Something went wrong. Please try again.";
  }

  return "Something went wrong. Please try again.";
}

export function calmSuccess(verb: string, noun: string): string {
  const map: Record<string, string> = {
    created: `${noun} created successfully.`,
    updated: `${noun} updated successfully.`,
    deleted: `${noun} deleted successfully.`,
    approved: `${noun} approved and payment released.`,
    paid: `Payment sent successfully.`,
    sent: `${noun} sent successfully.`,
    saved: `${noun} saved.`,
  };
  return map[verb] ?? `${noun} ${verb} successfully.`;
}
