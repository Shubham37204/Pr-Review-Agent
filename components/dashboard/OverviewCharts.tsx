"use client";

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const timeData = [
  { name: 'Mon', score: 65 },
  { name: 'Tue', score: 72 },
  { name: 'Wed', score: 68 },
  { name: 'Thu', score: 85 },
  { name: 'Fri', score: 78 },
  { name: 'Sat', score: 90 },
  { name: 'Sun', score: 82 },
];

const sentimentData = [
  { name: 'Constructive', value: 65 },
  { name: 'Critical', value: 25 },
  { name: 'Suggestion', value: 10 },
];

const distributionData = [
  { name: '0-20', count: 2 },
  { name: '21-40', count: 5 },
  { name: '41-60', count: 12 },
  { name: '61-80', count: 25 },
  { name: '81-100', count: 18 },
];

const COLORS = ['#10b981', '#f43f5e', '#3b82f6'];

export interface OverviewChartsProps {
  reviews: any[];
}

export function OverviewCharts({ reviews }: OverviewChartsProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent><div className="h-[300px] w-full animate-pulse bg-muted/50 rounded-md mt-6" /></CardContent>
        </Card>
        <Card>
          <CardContent><div className="h-[300px] w-full animate-pulse bg-muted/50 rounded-md mt-6" /></CardContent>
        </Card>
      </div>
    );
  }

  // Dynamic Data Calculation
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  });

  const dynamicTimeData = last7Days.map(day => {
    const dayReviews = reviews.filter(r => 
      new Date(r.createdAt).toLocaleDateString('en-US', { weekday: 'short' }) === day &&
      r.status === "COMPLETED"
    );
    const avg = dayReviews.length > 0 
      ? dayReviews.reduce((acc, r) => acc + (r.result?.score || 0), 0) / dayReviews.length
      : 0;
    return { name: day, score: Math.round(avg) };
  });

  const completed = reviews.filter(r => r.status === "COMPLETED");
  const sentimentCounts = {
    Constructive: completed.filter(r => (r.result?.score || 0) >= 70).length,
    Critical: completed.filter(r => (r.result?.score || 0) < 40).length,
    Suggestion: completed.filter(r => (r.result?.score || 0) >= 40 && (r.result?.score || 0) < 70).length,
  };

  const dynamicSentimentData = [
    { name: 'Constructive', value: sentimentCounts.Constructive },
    { name: 'Critical', value: sentimentCounts.Critical },
    { name: 'Suggestion', value: sentimentCounts.Suggestion },
  ].filter(d => d.value > 0);

  const hasData = dynamicTimeData.some(d => d.score > 0) || dynamicSentimentData.length > 0;

  if (!hasData) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
           <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>Visual insights will appear here once you have analyzed PRs.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[300px]">
            <p className="text-sm text-muted-foreground italic">Insufficient data to generate trends.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Analysis</CardTitle>
            <CardDescription>Breakdown of review feedback types.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[300px]">
            <p className="text-sm text-muted-foreground italic">No sentiment data available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Line Chart: Reviews over time */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Average Score Trends</CardTitle>
          <CardDescription>Daily performance metric over the last 7 days.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dynamicTimeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  itemStyle={{ color: 'hsl(var(--primary))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: 'hsl(var(--primary))' }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart: Sentiment Split */}
      <Card>
        <CardHeader>
          <CardTitle>Review Sentiment</CardTitle>
          <CardDescription>Distribution of feedback types.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dynamicSentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dynamicSentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 text-xs mt-4">
              {dynamicSentimentData.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


