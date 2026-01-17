import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  ActivationPoint,
  IssueCategoryPoint,
  MetricPoint,
} from "@/lib/mock-data";
import { formatDateShort } from "@/lib/format";

type InsightsPanelProps = {
  activitySeries: MetricPoint[];
  activationSeries: ActivationPoint[];
  issueCategorySeries: IssueCategoryPoint[];
};

export default function InsightsPanel({
  activitySeries,
  activationSeries,
  issueCategorySeries,
}: InsightsPanelProps) {
  const mutedStroke = "var(--muted-foreground)";

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="activation">Activation</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="mt-4">
            <div className="h-64 min-h-[256px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minHeight={256} minWidth={0}>
                <LineChart data={activitySeries}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatDateShort}
                  />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="issues"
                    stroke={mutedStroke}
                    strokeWidth={2}
                    strokeOpacity={0.9}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="comments"
                    stroke={mutedStroke}
                    strokeWidth={2}
                    strokeOpacity={0.6}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="votes"
                    stroke={mutedStroke}
                    strokeWidth={2}
                    strokeOpacity={0.35}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="activation" className="mt-4">
            <div className="h-64 min-h-[256px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minHeight={256} minWidth={0}>
                <BarChart data={activationSeries}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "12px",
                    }}
                  />
                  <Bar dataKey="dormant" stackId="a" fill={mutedStroke} fillOpacity={0.35} />
                  <Bar dataKey="seedling" stackId="a" fill={mutedStroke} fillOpacity={0.55} />
                  <Bar dataKey="rooted" stackId="a" fill={mutedStroke} fillOpacity={0.75} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="issues" className="mt-4">
            <div className="h-64 min-h-[256px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minHeight={256} minWidth={0}>
                <BarChart data={issueCategorySeries} layout="vertical">
                  <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis
                    dataKey="category"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "12px",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill={mutedStroke}
                    fillOpacity={0.6}
                    radius={[6, 6, 6, 6]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
