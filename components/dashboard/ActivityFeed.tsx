import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Clock, Zap, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Activity {
  id: string | number;
  type: string;
  title: string;
  description: string;
  time: string;
  status: "completed" | "flagged" | "processing" | "metric";
}

const statusConfig = {
  completed: { icon: CheckCircle2, color: "text-emerald-500" },
  flagged: { icon: AlertCircle, color: "text-rose-500" },
  processing: { icon: Clock, color: "text-blue-500" },
  metric: { icon: Zap, color: "text-amber-500" },
};

interface ActivityFeedProps {
  activities: Activity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Inbox className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No activity yet</p>
            <p className="text-xs text-muted-foreground mt-1">Start by submitting your first PR URL.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activities.map((activity) => {
              const config = statusConfig[activity.status] || statusConfig.completed;
              const Icon = config.icon;
              return (
                <div key={activity.id} className="flex gap-4">
                  <div className={cn("mt-1 shrink-0", config.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 overflow-hidden">
                    <p className="text-sm font-medium leading-none truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{activity.description}</p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      {activity.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

