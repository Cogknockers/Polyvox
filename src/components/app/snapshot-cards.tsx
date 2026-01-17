import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SnapshotMetric } from "@/lib/mock-data";
import { formatCompactNumber } from "@/lib/format";

type SnapshotCardsProps = {
  metrics: SnapshotMetric[];
};

export default function SnapshotCards({ metrics }: SnapshotCardsProps) {
  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Local Snapshot</h2>
        <p className="text-xs text-muted-foreground">
          Last 7 days - auto-refreshing
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label} className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-2xl font-semibold">
                {typeof metric.value === "number"
                  ? formatCompactNumber(metric.value)
                  : metric.value}
              </p>
              {metric.deltaLabel ? (
                <Badge variant="secondary" className="text-xs font-medium">
                  {metric.deltaLabel}
                </Badge>
              ) : null}
              {metric.hint ? (
                <p className="text-xs text-muted-foreground">{metric.hint}</p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
