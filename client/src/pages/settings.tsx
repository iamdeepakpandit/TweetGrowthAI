import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Settings() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contentTopics = [] } = useQuery<any[]>({
    queryKey: ["/api/content-topics"],
  });

  const { data: userTopics = [] } = useQuery<any[]>({
    queryKey: ["/api/user-topics"],
  });

  // Update selectedTopics when userTopics data changes
  useEffect(() => {
    if (Array.isArray(userTopics) && userTopics.length > 0) {
      const topicIds = (userTopics as any[]).map((ut: any) => ut.topicId);
      setSelectedTopics(prev => {
        // Only update if the arrays are different to prevent infinite loop
        if (JSON.stringify(prev.sort()) !== JSON.stringify(topicIds.sort())) {
          return topicIds;
        }
        return prev;
      });
    } else {
      setSelectedTopics(prev => prev.length > 0 ? [] : prev);
    }
  }, [userTopics])

  const { data: twitterAccounts = [] } = useQuery<any[]>({
    queryKey: ["/api/twitter/accounts"],
  });

  const updateTopicsMutation = useMutation({
    mutationFn: async (topicIds: string[]) => {
      const response = await apiRequest("POST", "/api/user-topics", { topicIds });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-topics"] });
      toast({
        title: "Topics Updated",
        description: "Your content topics have been updated successfully!",
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
        description: "Failed to update topics. Please try again.",
        variant: "destructive",
      });
    },
  });

  const connectTwitterMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/twitter/auth-url");
      const data = await response.json();
      window.location.href = data.authUrl;
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
        title: "Connection Failed",
        description: "Failed to initiate Twitter connection. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleSaveTopics = () => {
    updateTopicsMutation.mutate(selectedTopics);
  };

  const handleConnectTwitter = () => {
    connectTwitterMutation.mutate();
  };

  const disconnectMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const response = await apiRequest("DELETE", `/api/twitter/accounts/${accountId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/twitter/accounts"] });
      toast({
        title: "Account Disconnected",
        description: "Twitter account has been disconnected successfully.",
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
        title: "Disconnect Failed",
        description: "Failed to disconnect Twitter account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDisconnectTwitter = (accountId: string) => {
    disconnectMutation.mutate(accountId);
  };

  return (
    <div className="flex min-h-screen bg-slate-50" data-testid="page-settings">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        
        <div className="p-6 space-y-6">
          {/* Twitter Account Connection */}
          <Card>
            <CardHeader className="border-b border-slate-200">
              <CardTitle className="text-lg font-semibold text-slate-800">
                Twitter Account Connection
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6">
              {twitterAccounts.length > 0 ? (
                <div className="space-y-4">
                  {twitterAccounts.map((account: any) => (
                    <div 
                      key={account.id}
                      className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg"
                      data-testid={`connected-account-${account.username}`}
                    >
                      <img 
                        src={account.profileImageUrl} 
                        alt={`${account.username} profile`}
                        className="w-10 h-10 rounded-full" 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-800">@{account.username}</p>
                        <p className="text-xs text-slate-500">
                          {account.followerCount?.toLocaleString() || 0} followers
                        </p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></div>
                        Connected
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="fab fa-twitter text-slate-400 text-4xl mb-4"></i>
                  <h3 className="text-lg font-medium text-slate-800 mb-2">No Twitter Account Connected</h3>
                  <p className="text-slate-600 mb-6">
                    Connect your Twitter account to start generating and posting content.
                  </p>
                  <Button 
                    onClick={handleConnectTwitter}
                    disabled={connectTwitterMutation.isPending}
                    data-testid="button-connect-twitter"
                  >
                    {connectTwitterMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Connecting...
                      </>
                    ) : (
                      <>
                        <i className="fab fa-twitter mr-2"></i>
                        Connect Twitter Account
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content Topics */}
          <Card>
            <CardHeader className="border-b border-slate-200">
              <CardTitle className="text-lg font-semibold text-slate-800">
                Content Topics
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="space-y-4">
                <Label className="text-sm font-medium text-slate-700">
                  Select topics for AI content generation
                </Label>
                
                <div className="flex flex-wrap gap-2">
                  {contentTopics.map((topic: any) => {
                    const isSelected = selectedTopics.includes(topic.id);
                    return (
                      <button
                        key={topic.id}
                        onClick={() => handleTopicToggle(topic.id)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-blue-100 text-blue-700 border-2 border-blue-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-2 border-transparent'
                        }`}
                        data-testid={`topic-setting-${topic.name.toLowerCase()}`}
                      >
                        <i className={`${topic.icon} mr-1`}></i>
                        {topic.name}
                      </button>
                    );
                  })}
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleSaveTopics}
                    disabled={updateTopicsMutation.isPending}
                    data-testid="button-save-topics"
                  >
                    {updateTopicsMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save mr-2"></i>
                        Save Topics
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Management */}
          <Card>
            <CardHeader className="border-b border-slate-200">
              <CardTitle className="text-lg font-semibold text-slate-800">
                Account Management
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="space-y-4">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/api/logout'}
                  data-testid="button-logout"
                >
                  <i className="fas fa-sign-out-alt mr-2"></i>
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
