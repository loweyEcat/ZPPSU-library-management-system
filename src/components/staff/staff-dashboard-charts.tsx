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
  Legend,
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

interface MonthlyReviewActivity {
  month: string;
  reviews: number;
  year: number;
}

interface DocumentTypeByStatus {
  type: string;
  pending: number;
  approved: number;
  rejected: number;
  revision: number;
}

interface StaffDashboardChartsProps {
  documentTypeDistribution: DocumentTypeDistribution[];
  statusDistribution: StatusDistribution[];
  monthlyReviewActivity: MonthlyReviewActivity[];
  documentTypeByStatus: DocumentTypeByStatus[];
}

// Maroon/primary color theme
const COLORS = {
  thesis: "#800020", // Maroon
  journal: "#A0522D", // Sienna
  capstone: "#8B4513", // Saddle Brown
  ebooks: "#CD5C5C", // Indian Red
  approved: "#22c55e", // Green
  pending: "#f59e0b", // Amber
  rejected: "#ef4444", // Red
  revision: "#eab308", // Yellow
  default: "#6b7280", // Gray
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
  if (statusLower.includes("revision")) return COLORS.revision;
  return COLORS.default;
}

const chartConfig = {
  count: {
    label: "Count",
    color: "hsl(var(--chart-1))",
  },
  reviews: {
    label: "Reviews",
    color: "#800020", // Maroon
  },
  pending: {
    label: "Pending",
    color: "#f59e0b",
  },
  approved: {
    label: "Approved",
    color: "#22c55e",
  },
  rejected: {
    label: "Rejected",
    color: "#ef4444",
  },
  revision: {
    label: "Revision",
    color: "#eab308",
  },
};

export function StaffDashboardCharts({
  documentTypeDistribution,
  statusDistribution,
  monthlyReviewActivity,
  documentTypeByStatus,
}: StaffDashboardChartsProps) {
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

  // Prepare data for monthly review activity line chart
  const reviewLineData = monthlyReviewActivity.map((item) => ({
    month: `${item.month} ${item.year}`,
    reviews: item.reviews,
  }));

  // Prepare data for document type by status stacked bar chart
  const typeByStatusData = documentTypeByStatus.map((item) => ({
    type: item.type,
    Pending: item.pending,
    Approved: item.approved,
    Rejected: item.rejected,
    Revision: item.revision,
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
              Breakdown of assigned documents by type
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
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>
              Breakdown of documents by review status
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

      {/* Second Row: Monthly Review Activity and Document Type by Status */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Monthly Review Activity Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Review Activity</CardTitle>
            <CardDescription>
              Number of documents reviewed over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyReviewActivity.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <AreaChart data={reviewLineData}>
                  <defs>
                    <linearGradient
                      id="colorReviews"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#800020" stopOpacity={0.8} />
                      <stop
                        offset="95%"
                        stopColor="#800020"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
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
                                <span className="text-sm font-medium">
                                  {payload[0].payload.month}
                                </span>
                                <span className="text-sm font-bold text-[#800020]">
                                  {payload[0].value} review
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
                    dataKey="reviews"
                    stroke="#800020"
                    fill="url(#colorReviews)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                <p>No review activity data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document Type by Status Stacked Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Document Type by Status</CardTitle>
            <CardDescription>
              Status breakdown for each document type
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documentTypeByStatus.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <BarChart data={typeByStatusData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="type"
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
                              <div className="text-sm font-medium">
                                {payload[0].payload.type}
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
                                    {entry.name}:
                                  </span>
                                  <span className="text-sm font-bold">
                                    {entry.value}
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
                  <Legend />
                  <Bar
                    dataKey="Pending"
                    stackId="a"
                    fill="#f59e0b"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="Approved"
                    stackId="a"
                    fill="#22c55e"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="Rejected"
                    stackId="a"
                    fill="#ef4444"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="Revision"
                    stackId="a"
                    fill="#eab308"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                <p>No document type data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
