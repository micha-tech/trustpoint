export const JobState = {
  DRAFT: "DRAFT",
  PENDING_PAYMENT: "PENDING_PAYMENT",
  ACTIVE: "ACTIVE",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  DISPUTED: "DISPUTED",
} as const;
export type JobState = (typeof JobState)[keyof typeof JobState];

const JOB_TRANSITIONS: Record<JobState, JobState[]> = {
  DRAFT: ["PENDING_PAYMENT", "CANCELLED"],
  PENDING_PAYMENT: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["IN_PROGRESS", "DISPUTED", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "DISPUTED", "CANCELLED"],
  COMPLETED: ["DISPUTED"],
  CANCELLED: [],
  DISPUTED: ["COMPLETED", "CANCELLED"],
};

export function transitionJob(from: JobState, to: JobState): JobState {
  const allowed = JOB_TRANSITIONS[from];
  if (!allowed?.includes(to)) {
    throw new Error(`Invalid job transition: ${from} → ${to}`);
  }
  return to;
}

export const EscrowState = {
  UNFUNDED: "UNFUNDED",
  PARTIALLY_FUNDED: "PARTIALLY_FUNDED",
  FUNDED: "FUNDED",
  PARTIALLY_RELEASED: "PARTIALLY_RELEASED",
  RELEASED: "RELEASED",
  REFUNDED: "REFUNDED",
  DISPUTED: "DISPUTED",
} as const;
export type EscrowState = (typeof EscrowState)[keyof typeof EscrowState];

const ESCROW_TRANSITIONS: Record<EscrowState, EscrowState[]> = {
  UNFUNDED: ["PARTIALLY_FUNDED", "FUNDED", "DISPUTED"],
  PARTIALLY_FUNDED: ["FUNDED", "REFUNDED", "DISPUTED"],
  FUNDED: ["PARTIALLY_RELEASED", "RELEASED", "REFUNDED", "DISPUTED"],
  PARTIALLY_RELEASED: ["RELEASED", "DISPUTED"],
  RELEASED: ["DISPUTED"],
  REFUNDED: [],
  DISPUTED: ["RELEASED", "REFUNDED"],
};

export function transitionEscrow(from: EscrowState, to: EscrowState): EscrowState {
  const allowed = ESCROW_TRANSITIONS[from];
  if (!allowed?.includes(to)) {
    throw new Error(`Invalid escrow transition: ${from} → ${to}`);
  }
  return to;
}
