import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

interface QuickActionsProps {
  pendingCount?: number;
}

export default function QuickActions({ pendingCount = 0 }: QuickActionsProps) {
  const [, setLocation] = useLocation();

  const actions = [
    {
      icon: "fas fa-robot",
      label: "Generate Content",
      description: "Create AI-powered tweets",
      color: "text-blue-600",
      onClick: () => setLocation('/content-generator'),
      testId: "action-generate"
    },
    {
      icon: "fas fa-check-circle", 
      label: "Review Queue",
      description: "Approve pending tweets",
      color: "text-emerald-600",
      onClick: () => setLocation('/schedule'),
      badge: pendingCount > 0 ? pendingCount : undefined,
      testId: "action-review"
    },
    {
      icon: "fas fa-chart-bar",
      label: "View Analytics", 
      description: "Check performance metrics",
      color: "text-purple-600",
      onClick: () => setLocation('/analytics'),
      testId: "action-analytics"
    }
  ];

  return (
    <Card data-testid="quick-actions">
      <CardHeader className="border-b border-slate-200">
        <CardTitle className="text-lg font-semibold text-slate-800">
          Quick Actions
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="w-full flex items-center justify-between p-3 h-auto text-left hover:bg-slate-50 transition-colors"
              onClick={action.onClick}
              data-testid={action.testId}
            >
              <div className="flex items-center space-x-3">
                <i className={`${action.icon} ${action.color}`}></i>
                <div>
                  <span className="font-medium text-slate-800 block">{action.label}</span>
                  <span className="text-xs text-slate-600">{action.description}</span>
                </div>
              </div>
              <div className="flex items-center">
                {action.badge && (
                  <Badge 
                    className="bg-amber-100 text-amber-800 mr-2"
                    data-testid={`badge-${action.testId}`}
                  >
                    {action.badge}
                  </Badge>
                )}
                <i className="fas fa-chevron-right text-slate-400 text-sm"></i>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
