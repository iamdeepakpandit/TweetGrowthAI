import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import MetricsGrid from "@/components/dashboard/metrics-grid";
import ContentGenerator from "@/components/dashboard/content-generator";
import UpcomingPosts from "@/components/dashboard/upcoming-posts";
import QuickActions from "@/components/dashboard/quick-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tweet } from "@shared/schema";

interface DashboardStats {
  followerCount: number;
  engagementRate: number;
  tweetsThisMonth: number;
  pendingApprovals: number;
}

export default function Dashboard() {
  const { data: tweets = [] } = useQuery<Tweet[]>({
    queryKey: ["/api/tweets"],
  });

  const { data: dashboardStats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard-stats"],
  });

  const upcomingTweets = tweets.filter((tweet: any) => 
    tweet.status === 'scheduled' && tweet.scheduledFor && new Date(tweet.scheduledFor) > new Date()
  ).slice(0, 3);

  const topPerformingTweets = tweets.filter((tweet: any) => 
    tweet.status === 'posted' && tweet.engagementData
  ).sort((a: any, b: any) => {
    const aEngagement = (a.engagementData?.like_count || 0) + (a.engagementData?.retweet_count || 0);
    const bEngagement = (b.engagementData?.like_count || 0) + (b.engagementData?.retweet_count || 0);
    return bEngagement - aEngagement;
  }).slice(0, 3);

  return (
    <div className="flex min-h-screen bg-slate-50" data-testid="page-dashboard">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        
        <div className="p-6 space-y-6">
          <MetricsGrid stats={dashboardStats} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ContentGenerator />
            </div>
            
            <div className="space-y-6">
              <QuickActions pendingCount={dashboardStats?.pendingApprovals || 0} />
              <UpcomingPosts tweets={upcomingTweets} />
            </div>
          </div>

          {/* Performance Overview */}
          <Card data-testid="card-performance">
            <CardHeader className="border-b border-slate-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-800">
                  Performance Overview
                </CardTitle>
                <Select defaultValue="7days">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="3months">Last 3 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart Placeholders */}
                <div>
                  <h4 className="font-medium text-slate-800 mb-4">Daily Engagement</h4>
                  <div className="h-48 bg-slate-50 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300">
                    <div className="text-center">
                      <i className="fas fa-chart-line text-slate-400 text-2xl mb-2"></i>
                      <p className="text-slate-600 text-sm">Engagement chart will appear here</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-800 mb-4">Follower Growth</h4>
                  <div className="h-48 bg-slate-50 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300">
                    <div className="text-center">
                      <i className="fas fa-users text-slate-400 text-2xl mb-2"></i>
                      <p className="text-slate-600 text-sm">Growth chart will appear here</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Top Performing Posts */}
              {topPerformingTweets.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-slate-800 mb-4">Top Performing Posts</h4>
                  <div className="space-y-3">
                    {topPerformingTweets.map((tweet: any) => (
                      <div 
                        key={tweet.id} 
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                        data-testid={`tweet-performance-${tweet.id}`}
                      >
                        <div className="flex-1">
                          <p className="text-sm text-slate-800 line-clamp-2">
                            {tweet.content}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">
                            Posted {tweet.postedAt ? new Date(tweet.postedAt).toLocaleDateString() : 'Recently'}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="flex space-x-4 text-sm text-slate-600">
                            <span data-testid={`likes-${tweet.id}`}>
                              <i className="fas fa-heart text-red-500 mr-1"></i>
                              {tweet.engagementData?.like_count || 0}
                            </span>
                            <span data-testid={`retweets-${tweet.id}`}>
                              <i className="fas fa-retweet text-blue-500 mr-1"></i>
                              {tweet.engagementData?.retweet_count || 0}
                            </span>
                            <span data-testid={`replies-${tweet.id}`}>
                              <i className="fas fa-comment text-gray-500 mr-1"></i>
                              {tweet.engagementData?.reply_count || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
