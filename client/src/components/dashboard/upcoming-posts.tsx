import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface UpcomingPostsProps {
  tweets: any[];
}

export default function UpcomingPosts({ tweets = [] }: UpcomingPostsProps) {
  const [, setLocation] = useLocation();

  const formatScheduledTime = (scheduledFor: string) => {
    const date = new Date(scheduledFor);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const tweetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (tweetDate.getTime() === today.getTime()) {
      return `Today, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    } else if (tweetDate.getTime() === tomorrow.getTime()) {
      return `Tomorrow, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { 
        weekday: 'short', 
        hour: 'numeric', 
        minute: '2-digit' 
      });
    }
  };

  const getStatusColor = (index: number) => {
    const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500'];
    return colors[index % colors.length];
  };

  const truncateContent = (content: string, maxLength: number = 60) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <Card data-testid="upcoming-posts">
      <CardHeader className="border-b border-slate-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-800">
            Upcoming Posts
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation('/schedule')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            data-testid="button-view-all"
          >
            View All
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {tweets.length === 0 ? (
          <div className="text-center py-8" data-testid="empty-state">
            <i className="fas fa-calendar-alt text-slate-400 text-3xl mb-4"></i>
            <h3 className="text-lg font-medium text-slate-800 mb-2">No Upcoming Posts</h3>
            <p className="text-slate-600 text-sm">
              Schedule some content to see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tweets.map((tweet, index) => (
              <div 
                key={tweet.id}
                className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                data-testid={`upcoming-post-${tweet.id}`}
              >
                <div className={`w-2 h-2 ${getStatusColor(index)} rounded-full mt-2 flex-shrink-0`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 font-medium mb-1" data-testid={`post-time-${tweet.id}`}>
                    {tweet.scheduledFor ? formatScheduledTime(tweet.scheduledFor) : 'Not scheduled'}
                  </p>
                  <p className="text-xs text-slate-600 line-clamp-2" data-testid={`post-content-${tweet.id}`}>
                    {truncateContent(tweet.content)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
