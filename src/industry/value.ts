export type TimeRow = {
  readonly baselineMinutes: number | null;
  readonly spentMinutes: number | null;
  readonly reviewMinutes: number | null;
  readonly crisisEveryLine: boolean;
};
export type TimeVerdict =
  | { readonly status: "unknown" }
  | {
      readonly status: "failed";
      readonly netMinutes: number;
      readonly reason: "crisis" | "non_positive";
    }
  | { readonly status: "kept"; readonly netMinutes: number };

function usable(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value >= 0;
}

function rowNet(row: TimeRow): number | undefined {
  const baseline = row.baselineMinutes;
  const spent = row.spentMinutes;
  const review = row.reviewMinutes;
  if (!usable(baseline) || !usable(spent) || !usable(review)) return undefined;
  return baseline - spent - review;
}

export function scoreTimeWindow(rows: readonly TimeRow[]): TimeVerdict {
  if (rows.length === 0) return { status: "unknown" };
  const nets: number[] = [];
  for (const row of rows) {
    const net = rowNet(row);
    if (net === undefined) return { status: "unknown" };
    nets.push(net);
  }
  const netMinutes = nets.reduce((sum, net) => sum + net, 0);
  if (rows.some((row) => row.crisisEveryLine))
    return { status: "failed", netMinutes, reason: "crisis" };
  if (netMinutes <= 0) return { status: "failed", netMinutes, reason: "non_positive" };
  return { status: "kept", netMinutes };
}
