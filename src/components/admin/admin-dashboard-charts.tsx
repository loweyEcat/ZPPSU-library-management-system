"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";

interface DocumentTypeDistribution {
  type: string;
  count: number;
  percentage: number;
}

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

interface CollegeDistribution {
  college: string;
  count: number;
  percentage: number;
}

interface ReadingActivity {
  month: string;
  sessions: number;
  minutes: number;
  year: number;
}

interface AdminDashboardChartsProps {
  documentTypeDistribution: DocumentTypeDistribution[];
  statusDistribution: StatusDistribution[];
  monthlySubmissions: MonthlySubmission[];
  collegeDistribution: CollegeDistribution[];
  readingActivity: ReadingActivity[];
}

const COLORS = {
  thesis: "#3b82f6",
  journal: "#8b5cf6",
  capstone: "#22c55e",
  ebooks: "#f59e0b",
  approved: "#22c55e",
  pending: "#f59e0b",
  rejected: "#ef4444",
  published: "#8b5cf6",
  revision: "#eab308",
  default: "#6b7280",
};

function getTypeColor(type: string): string {
  const typeLower = type.toLowerCase();
  if (typeLower.includes("thesis")) return COLORS.thesis;
  if (typeLower.includes("journal")) return COLORS.journal;
  if (typeLower.includes("capstone")) return COLORS.capstone;
  if (typeLower.includes("ebook")) return COLORS.ebooks;
  return COLORS.default;
}

function getStatusColor(status: string): string {
  const statusLower = status.toLowerCase();
  if (statusLower.includes("approved")) return COLORS.approved;
  if (statusLower.includes("pending") || statusLower.includes("under review"))
    return COLORS.pending;
  if (statusLower.includes("rejected")) return COLORS.rejected;
  if (statusLower.includes("published")) return COLORS.published;
  if (statusLower.includes("revision")) return COLORS.revision;
  return COLORS.default;
}

const chartConfig = {
  count: {
    label: "Count",
    color: "hsl(var(--chart-1))",
  },
  submissions: {
    label: "Submissions",
    color: "hsl(var(--chart-1))",
  },
  sessions: {
    label: "Sessions",
    color: "hsl(var(--chart-2))",
  },
  minutes: {
    label: "Minutes",
    color: "hsl(var(--chart-3))",
  },
};

export function AdminDashboardCharts({
  documentTypeDistribution,
  statusDistribution,
  monthlySubmissions,
  collegeDistribution,
  readingActivity,
}: AdminDashboardChartsProps) {
  // Prepare data for document type pie chart
  const typePieData = documentTypeDistribution.map((item) => ({
    name: item.type,
    value: item.count,
    fill: getTypeColor(item.type),
  }));

  // Prepare data for status pie chart
  const statusPieData = statusDistribution.map((item) => ({
    name: item.status,
    value: item.count,
    fill: getStatusColor(item.status),
  }));

  // Prepare data for monthly submissions bar chart
  const submissionsBarData = monthlySubmissions.map((item) => ({
    month: `${item.month} ${item.year}`,
    submissions: item.count,
  }));

  // Prepare data for college distribution bar chart
  const collegeBarData = collegeDistribution.slice(0, 10).map((item) => ({
    college: item.college,
    students: item.count,
  }));

  // Prepare data for reading activity line chart
  const readingLineData = readingActivity.map((item) => ({
    month: `${item.month} ${item.year}`,
    sessions: item.sessions,
    minutes: Math.round(item.minutes / 60), // Convert to hours
  }));

  return (
    <div className="space-y-6">
      {/* First Row: Document Type and Status Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Document Type Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Document Type Distribution</CardTitle>
            <CardDescription>
              Breakdown of documents by type (Thesis, Journal, Capstone, Ebooks)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documentTypeDistribution.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <PieChart>
                  <Pie
                    data={typePieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {typePieData.map((entry, index) => (
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
                                <span className="text-sm font-medium">
                                  {payload[0].name}
                                </span>
                                <span className="text-sm font-bold">
                                  {payload[0].value} document
                                  {payload[0].value !== 1 ? "s" : ""}
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

        {/* Status Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Document Status Distribution</CardTitle>
            <CardDescription>
              Breakdown of documents by submission status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statusDistribution.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
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
                                <span className="text-sm font-medium">
                                  {payload[0].name}
                                </span>
                                <span className="text-sm font-bold">
                                  {payload[0].value} document
                                  {payload[0].value !== 1 ? "s" : ""}
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
                <p>No status data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second Row: Monthly Submissions and College Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Monthly Submissions Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Submissions Trend</CardTitle>
            <CardDescription>
              Document submissions over the last 12 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monthlySubmissions.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <BarChart data={submissionsBarData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    className="text-xs"
                    angle={-45}
                    textAnchor="end"
                    height={60}
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
                                <span className="text-sm font-medium">
                                  {payload[0].payload.month}
                                </span>
                                <span className="text-sm font-bold text-primary">
                                  {payload[0].value} submission
                                  {payload[0].value !== 1 ? "s" : ""}
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
                    fill="var(--color-submissions)"
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

        {/* College Distribution Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Student Distribution by College</CardTitle>
            <CardDescription>
              Number of students per college (Top 10)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {collegeDistribution.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <BarChart data={collegeBarData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    className="text-xs"
                  />
                  <YAxis
                    dataKey="college"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    className="text-xs"
                    width={100}
                  />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid gap-2">
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-sm font-medium">
                                  {payload[0].payload.college}
                                </span>
                                <span className="text-sm font-bold text-primary">
                                  {payload[0].value} student
                                  {payload[0].value !== 1 ? "s" : ""}
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
                    dataKey="students"
                    fill="var(--color-count)"
                    radius={[0, 4, 4, 0]}
                    className="fill-primary"
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                <p>No college data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Third Row: Reading Activity - Area Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Reading Activity Trend</CardTitle>
          <CardDescription>
            Document reading sessions and hours over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          {readingActivity.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px]">
              <AreaChart data={readingLineData}>
                <defs>
                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-sessions)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-sessions)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-minutes)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-minutes)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                />
                <YAxis
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
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
                              <span className="text-sm font-medium">
                                {payload[0].payload.month}
                              </span>
                            </div>
                            {payload.map((entry, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between gap-4"
                              >
                                <span
                                  className="text-sm"
                                  style={{ color: entry.color }}
                                >
                                  {entry.dataKey === "sessions"
                                    ? "Sessions"
                                    : "Hours"}
                                </span>
                                <span className="text-sm font-bold">
                                  {entry.value}
                                  {entry.dataKey === "sessions" ? "" : " hrs"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="sessions"
                  stroke="var(--color-sessions)"
                  fill="url(#colorSessions)"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="minutes"
                  stroke="var(--color-minutes)"
                  fill="url(#colorMinutes)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              <p>No reading activity data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fourth Row: Monthly Submissions - Area Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Submissions Trend (Area)</CardTitle>
          <CardDescription>
            Document submissions over the last 12 months with area visualization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {monthlySubmissions.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px]">
              <AreaChart data={submissionsBarData}>
                <defs>
                  <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                  angle={-45}
                  textAnchor="end"
                  height={60}
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
                              <span className="text-sm font-medium">
                                {payload[0].payload.month}
                              </span>
                              <span className="text-sm font-bold text-primary">
                                {payload[0].value} submission
                                {payload[0].value !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="submissions"
                  stroke="hsl(var(--chart-1))"
                  fill="url(#colorSubmissions)"
                  strokeWidth={2}
                />
              </AreaChart>
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

