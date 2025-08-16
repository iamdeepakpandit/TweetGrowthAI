import { Card, CardContent } from "@/components/ui/card";

interface MetricsGridProps {
  stats?: {
    followerCount: number;
    engagementRate: number;
    tweetsThisMonth: number;
    pendingApprovals: number;
  };
}

export default function MetricsGrid({ stats }: MetricsGridProps) {
  const metrics = [
    {
      title: "Total Followers",
      value: stats?.followerCount?.toLocaleString() || "0",
      icon: "fas fa-users",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      change: "+12.5%",
      changeText: "vs last month",
      testId: "metric-followers"
    },
    {
      title: "Engagement Rate",
      value: `${stats?.engagementRate?.toFixed(1) || "0.0"}%`,
      icon: "fas fa-heart",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      change: "+0.3%",
      changeText: "vs last month",
      testId: "metric-engagement"
    },
    {
      title: "Tweets This Month",
      value: stats?.tweetsThisMonth?.toString() || "0",
      icon: "fab fa-twitter",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      change: "Target: 100 tweets",
      changeText: "",
      testId: "metric-tweets"
    },
    {
      title: "Pending Approval",
      value: stats?.pendingApprovals?.toString() || "0",
      icon: "fas fa-clock",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      change: (stats?.pendingApprovals || 0) > 0 ? "Review needed" : "All clear",
      changeText: "",
      changeColor: (stats?.pendingApprovals || 0) > 0 ? "text-amber-600" : "text-emerald-600",
      testId: "metric-pending"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="metrics-grid">
      {metrics.map((metric) => (
        <Card key={metric.title} className="shadow-sm border border-slate-200" data-testid={metric.testId}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{metric.title}</p>
                <p className="text-2xl font-bold text-slate-800 mt-2" data-testid={`${metric.testId}-value`}>
                  {metric.value}
                </p>
              </div>
              <div className={`w-12 h-12 ${metric.iconBg} rounded-lg flex items-center justify-center`}>
                <i className={`${metric.icon} ${metric.iconColor} text-lg`}></i>
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className={`font-medium ${metric.changeColor || 'text-emerald-600'}`}>
                {metric.change}
              </span>
              {metric.changeText && (
                <span className="text-slate-600 ml-2">{metric.changeText}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
