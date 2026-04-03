type StatusBadgeProps = {
  status: "success" | "warning";
  label: string;
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const className = status === "success" ? "badge badge-success" : "badge badge-warning";

  return <span className={className}>{label}</span>;
}
