import { Badge } from "@/components/ui/badge";

type StatusBadgeProps = {
  status: "success" | "warning";
  label: string;
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return <Badge variant={status}>{label}</Badge>;
}
