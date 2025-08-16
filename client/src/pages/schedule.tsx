import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Schedule() {
  const [selectedTab, setSelectedTab] = useState("scheduled");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tweets = [] } = useQuery<any[]>({
    queryKey: ["/api/tweets"],
  });

  const updateTweetMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await apiRequest("PATCH", `/api/tweets/${id}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tweets"] });
      toast({
        title: "Tweet Updated",
        description: "Tweet status has been updated successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Update Failed",
        description: "Failed to update tweet. Please try again.",
        variant: "destructive",
      });
    },
  });

  const postNowMutation = useMutation({
    mutationFn: async (tweetId: string) => {
      const response = await apiRequest("POST", `/api/tweets/${tweetId}/post-now`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tweets"] });
      toast({
        title: "Tweet Posted",
        description: "Tweet has been posted immediately!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Post Failed",
        description: "Failed to post tweet. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (tweetId: string) => {
    updateTweetMutation.mutate({
      id: tweetId,
      updates: { approvalStatus: 'approved' }
    });
  };

  const handleReject = (tweetId: string) => {
    updateTweetMutation.mutate({
      id: tweetId,
      updates: { approvalStatus: 'rejected' }
    });
  };

  const handlePostNow = (tweetId: string) => {
    postNowMutation.mutate(tweetId);
  };

  const getStatusBadge = (status: string, approvalStatus: string) => {
    if (status === 'posted') {
      return <Badge className="bg-emerald-100 text-emerald-800">Posted</Badge>;
    }
    if (status === 'failed') {
      return <Badge variant="destructive">Failed</Badge>;
    }
    if (status === 'scheduled' && approvalStatus === 'approved') {
      return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
    }
    if (approvalStatus === 'pending') {
      return <Badge className="bg-amber-100 text-amber-800">Pending Approval</Badge>;
    }
    if (approvalStatus === 'rejected') {
      return <Badge variant="secondary">Rejected</Badge>;
    }
    return <Badge variant="secondary">Draft</Badge>;
  };

  const scheduledTweets = tweets.filter((tweet: any) => 
    tweet.status === 'scheduled' && tweet.approvalStatus === 'approved'
  );

  const pendingTweets = tweets.filter((tweet: any) => 
    tweet.approvalStatus === 'pending'
  );

  const draftTweets = tweets.filter((tweet: any) => 
    tweet.status === 'draft' || tweet.approvalStatus === 'rejected'
  );

  const postedTweets = tweets.filter((tweet: any) => 
    tweet.status === 'posted'
  );

  const renderTweetCard = (tweet: any) => (
    <Card key={tweet.id} className="mb-4" data-testid={`tweet-card-${tweet.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className="text-slate-800 mb-2">{tweet.content}</p>
            {tweet.scheduledFor && (
              <p className="text-sm text-slate-600">
                <i className="fas fa-clock mr-1"></i>
                Scheduled for {new Date(tweet.scheduledFor).toLocaleString()}
              </p>
            )}
            {tweet.postedAt && (
              <p className="text-sm text-slate-600">
                <i className="fas fa-check mr-1"></i>
                Posted on {new Date(tweet.postedAt).toLocaleString()}
              </p>
            )}
          </div>
          {getStatusBadge(tweet.status, tweet.approvalStatus)}
        </div>
        
        {tweet.approvalStatus === 'pending' && (
          <div className="flex space-x-2 mt-3">
            <Button 
              size="sm" 
              onClick={() => handleApprove(tweet.id)}
              data-testid={`button-approve-${tweet.id}`}
            >
              <i className="fas fa-check mr-1"></i>
              Approve
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => handleReject(tweet.id)}
              data-testid={`button-reject-${tweet.id}`}
            >
              <i className="fas fa-times mr-1"></i>
              Reject
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handlePostNow(tweet.id)}
              data-testid={`button-post-now-${tweet.id}`}
            >
              <i className="fas fa-paper-plane mr-1"></i>
              Post Now
            </Button>
          </div>
        )}
        
        {tweet.status === 'posted' && tweet.engagementData && (
          <div className="flex space-x-4 mt-3 text-sm text-slate-600">
            <span data-testid={`likes-${tweet.id}`}>
              <i className="fas fa-heart text-red-500 mr-1"></i>
              {tweet.engagementData.like_count || 0}
            </span>
            <span data-testid={`retweets-${tweet.id}`}>
              <i className="fas fa-retweet text-blue-500 mr-1"></i>
              {tweet.engagementData.retweet_count || 0}
            </span>
            <span data-testid={`replies-${tweet.id}`}>
              <i className="fas fa-comment text-gray-500 mr-1"></i>
              {tweet.engagementData.reply_count || 0}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex min-h-screen bg-slate-50" data-testid="page-schedule">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        
        <div className="p-6">
          <Card>
            <CardHeader className="border-b border-slate-200">
              <CardTitle className="text-lg font-semibold text-slate-800">
                Content Schedule & Approval
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6">
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="pending" data-testid="tab-pending">
                    Pending Approval ({pendingTweets.length})
                  </TabsTrigger>
                  <TabsTrigger value="scheduled" data-testid="tab-scheduled">
                    Scheduled ({scheduledTweets.length})
                  </TabsTrigger>
                  <TabsTrigger value="drafts" data-testid="tab-drafts">
                    Drafts ({draftTweets.length})
                  </TabsTrigger>
                  <TabsTrigger value="posted" data-testid="tab-posted">
                    Posted ({postedTweets.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="pending" className="mt-6">
                  <div data-testid="content-pending">
                    {pendingTweets.length === 0 ? (
                      <div className="text-center py-12">
                        <i className="fas fa-check-circle text-slate-400 text-4xl mb-4"></i>
                        <h3 className="text-lg font-medium text-slate-800 mb-2">No Pending Approvals</h3>
                        <p className="text-slate-600">All tweets have been reviewed.</p>
                      </div>
                    ) : (
                      pendingTweets.map(renderTweetCard)
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="scheduled" className="mt-6">
                  <div data-testid="content-scheduled">
                    {scheduledTweets.length === 0 ? (
                      <div className="text-center py-12">
                        <i className="fas fa-calendar-alt text-slate-400 text-4xl mb-4"></i>
                        <h3 className="text-lg font-medium text-slate-800 mb-2">No Scheduled Tweets</h3>
                        <p className="text-slate-600">Schedule some content to see it here.</p>
                      </div>
                    ) : (
                      scheduledTweets.map(renderTweetCard)
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="drafts" className="mt-6">
                  <div data-testid="content-drafts">
                    {draftTweets.length === 0 ? (
                      <div className="text-center py-12">
                        <i className="fas fa-file-alt text-slate-400 text-4xl mb-4"></i>
                        <h3 className="text-lg font-medium text-slate-800 mb-2">No Drafts</h3>
                        <p className="text-slate-600">Create some content to see drafts here.</p>
                      </div>
                    ) : (
                      draftTweets.map(renderTweetCard)
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="posted" className="mt-6">
                  <div data-testid="content-posted">
                    {postedTweets.length === 0 ? (
                      <div className="text-center py-12">
                        <i className="fas fa-paper-plane text-slate-400 text-4xl mb-4"></i>
                        <h3 className="text-lg font-medium text-slate-800 mb-2">No Posted Tweets</h3>
                        <p className="text-slate-600">Your posted tweets will appear here.</p>
                      </div>
                    ) : (
                      postedTweets.map(renderTweetCard)
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
