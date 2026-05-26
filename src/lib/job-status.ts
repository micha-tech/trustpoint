export function getStatusLabel(status: string, approvedAt?: string | null): string {
  if (status === "COMPLETED") {
    return approvedAt ? "Released" : "Awaiting client approval";
  }
  const labels: Record<string, string> = {
    DRAFT: "Draft",
    PENDING_PAYMENT: "Awaiting Payment",
    ACTIVE: "Active",
    IN_PROGRESS: "In Progress",
    CANCELLED: "Cancelled",
    DISPUTED: "Under Review",
  };
  return labels[status] ?? status.replace("_", " ");
}

export function getStatusStyle(status: string, approvedAt?: string | null): string {
  if (status === "COMPLETED") {
    return approvedAt ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700";
  }
  const styles: Record<string, string> = {
    DRAFT: "bg-muted text-muted-foreground",
    PENDING_PAYMENT: "bg-amber-50 text-amber-700",
    ACTIVE: "bg-blue-50 text-blue-700",
    IN_PROGRESS: "bg-indigo-50 text-indigo-700",
    CANCELLED: "bg-red-50 text-red-700",
    DISPUTED: "bg-orange-50 text-orange-700",
  };
  return styles[status] ?? "bg-muted text-muted-foreground";
}
