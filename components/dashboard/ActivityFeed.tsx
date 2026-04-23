import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Clock, Zap } from "lucide-react";

const activities = [
  {
    id: 1,
    type: "completed",
    title: "Review Completed",
    description: "PR #124 analyzed with score 85/100",
    time: "2 mins ago",
    icon: CheckCircle2,
    color: "text-emerald-500",
  },
  {
    id: 2,
    type: "flagged",
    title: "Critical Issue Flagged",
    description: "Security vulnerability found in auth.ts",
    time: "1 hour ago",
    icon: AlertCircle,
    color: "text-rose-500",
  },
  {
    id: 3,
    type: "processing",
    title: "Review Started",
    description: "PR #125 is being processed in background",
    time: "3 hours ago",
    icon: Clock,
    color: "text-blue-500",
  },
  {
    id: 4,
    type: "metric",
    title: "Scalability Milestone",
    description: "All recent PRs meet 10k user capacity target",
    time: "5 hours ago",
    icon: Zap,
    color: "text-amber-500",
  },
];

export function ActivityFeed() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
            {activities.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex gap-4">
                  <div className={`mt-1 ${activity.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{activity.title}</p>
                <p className="text-xs text-muted-foreground">{activity.description}</p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  {activity.time}
                </p>
              </div>
            </div>
          );
        })}
        </div>
      </CardContent>
    </Card>
  );
}
