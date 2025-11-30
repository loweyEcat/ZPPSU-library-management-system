"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid } from "recharts";

interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

interface MonthlySubmission {
  month: string;
  count: number;
  year: number;
}

interface StudentDashboardChartsProps {
  statusDistribution: StatusDistribution[];
  monthlySubmissions: MonthlySubmission[];
}

const COLORS = {
  approved: "#22c55e",
  verified: "#3b82f6",
  pending: "#f59e0b",
  rejected: "#ef4444",
  published: "#8b5cf6",
  revision: "#eab308",
  default: "#6b7280",
};

function getStatusColor(status: string): string {
  const statusLower = status.toLowerCase();
  if (statusLower.includes("approved")) return COLORS.approved;
  if (statusLower.includes("verified")) return COLORS.verified;
  if (statusLower.includes("pending") || statusLower.includes("under review")) return COLORS.pending;
  if (statusLower.includes("rejected")) return COLORS.rejected;
  if (statusLower.includes("published")) return COLORS.published;
  if (statusLower.includes("revision")) return COLORS.revision;
  return COLORS.default;
}

const chartConfig = {
  count: {
    label: "Documents",
    color: "hsl(var(--chart-1))",
  },
  approved: {
    label: "Approved",
    color: COLORS.approved,
  },
  verified: {
    label: "Verified",
    color: COLORS.verified,
  },
  pending: {
    label: "Pending",
    color: COLORS.pending,
  },
  rejected: {
    label: "Rejected",
    color: COLORS.rejected,
  },
  published: {
    label: "Published",
    color: COLORS.published,
  },
};

export function StudentDashboardCharts({
  statusDistribution,
  monthlySubmissions,
}: StudentDashboardChartsProps) {
  // Prepare data for pie chart
  const pieData = statusDistribution.map((item) => ({
    name: item.status,
    value: item.count,
    fill: getStatusColor(item.status),
  }));

  // Prepare data for bar chart (monthly submissions)
  const barData = monthlySubmissions.map((item) => ({
    month: `${item.month} ${item.year}`,
    submissions: item.count,
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Status Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Document Status Distribution</CardTitle>
          <CardDescription>Breakdown of your thesis documents by status</CardDescription>
        </CardHeader>
        <CardContent>
          {statusDistribution.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px]">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid gap-2">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-sm font-medium">{payload[0].name}</span>
                              <span className="text-sm font-bold">
                                {payload[0].value} document{payload[0].value !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              <p>No documents to display</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Submissions Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Submission Timeline</CardTitle>
          <CardDescription>Your document submissions over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlySubmissions.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid gap-2">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-sm font-medium">{payload[0].payload.month}</span>
                              <span className="text-sm font-bold text-primary">
                                {payload[0].value} submission{payload[0].value !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="submissions"
                  fill="var(--color-count)"
                  radius={[4, 4, 0, 0]}
                  className="fill-primary"
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              <p>No submission data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

