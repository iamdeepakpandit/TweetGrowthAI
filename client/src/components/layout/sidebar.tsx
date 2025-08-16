import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  
  const { data: twitterAccounts = [] } = useQuery<any[]>({
    queryKey: ["/api/twitter/accounts"],
  });

  const { data: dashboardStats } = useQuery<any>({
    queryKey: ["/api/dashboard-stats"],
  });

  const primaryAccount = twitterAccounts[0];

  const menuItems = [
    { path: "/", icon: "fas fa-chart-line", label: "Dashboard" },
    { path: "/content-generator", icon: "fas fa-robot", label: "Content Generator" },
    { path: "/schedule", icon: "fas fa-calendar-alt", label: "Schedule" },
    { path: "/analytics", icon: "fas fa-chart-bar", label: "Analytics" },
    { path: "/settings", icon: "fas fa-cog", label: "Settings" },
  ];

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-slate-200 flex flex-col" data-testid="sidebar">
      {/* Logo and Brand */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <i className="fab fa-twitter text-white text-sm"></i>
          </div>
          <h1 className="text-xl font-bold text-slate-800" data-testid="text-brand">TweetBot AI</h1>
        </div>
      </div>

      {/* User Account Info */}
      {primaryAccount && (
        <div className="p-4 border-b border-slate-200" data-testid="user-account-card">
          <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
            <img 
              src={primaryAccount.profileImageUrl} 
              alt="User profile" 
              className="w-10 h-10 rounded-full" 
              data-testid="img-profile"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-slate-800" data-testid="text-username">
                @{primaryAccount.username}
              </p>
              <p className="text-xs text-slate-500" data-testid="text-follower-count">
                {primaryAccount.followerCount?.toLocaleString() || 0} followers
              </p>
            </div>
            <div className="w-2 h-2 bg-emerald-400 rounded-full" title="Connected" data-testid="status-connected"></div>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location === item.path;
            return (
              <li key={item.path}>
                <button
                  onClick={() => setLocation(item.path)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  data-testid={`link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <i className={`${item.icon} w-5`}></i>
                  <span>{item.label}</span>
                  {item.label === "Schedule" && dashboardStats?.pendingApprovals > 0 && (
                    <span 
                      className="bg-amber-100 text-amber-800 text-xs font-medium px-2 py-1 rounded-full"
                      data-testid="badge-pending-count"
                    >
                      {dashboardStats.pendingApprovals}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-200">
        <Button 
          className="w-full"
          onClick={() => setLocation('/content-generator')}
          data-testid="button-new-tweet"
        >
          <i className="fas fa-plus text-sm mr-2"></i>
          New Tweet
        </Button>
      </div>
    </aside>
  );
}
