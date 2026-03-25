interface StatusBadgeProps {
  value: string;
}

const STATUS_CLASS_MAP: Record<string, string> = {
  SANCTIONED: "badge-sanctioned",
  UNSANCTIONED_RUNNING: "badge-unsanctioned",
  PENDING_GOVERNANCE: "badge-pending",
  BLOCKED: "badge-blocked",
  RETIRED: "badge-retired",
  ACTIVE: "badge-active",
  EXPIRED: "badge-expired",
  PENDING: "badge-pending",
  REVOKED: "badge-expired",
  EXACT: "badge-exact",
  FUZZY: "badge-fuzzy",
  VENDOR_PRODUCT: "badge-vendor-product",
  MANUAL: "badge-manual",
  APPROVED: "badge-approved",
  REJECTED: "badge-rejected",
  NOT_REQUIRED: "badge-not-required",
};

function formatLabel(value: string): string {
  return value.replace(/_/g, " ");
}

export function StatusBadge({ value }: StatusBadgeProps) {
  const cls = STATUS_CLASS_MAP[value] ?? "";
  return <span className={`badge ${cls}`}>{formatLabel(value)}</span>;
}
