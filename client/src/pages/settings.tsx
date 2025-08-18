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

  // Assuming 'user' is available in the scope, perhaps from a context or another hook
  // For demonstration, let's assume it's fetched or provided elsewhere.
  // const { data: user } = useQuery({ queryKey: ["/api/user"] });

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

  const { data: socialAccounts = [] } = useQuery<any[]>({
    queryKey: ["/api/social/accounts"],
    // enabled: !!user, // Uncomment if 'user' is available and controls fetching
  });


  const connectTwitterMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/twitter/auth-url");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to get Twitter auth URL");
      }
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
      return data;
    },
    onError: (error: any) => {
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
      
      // Check if it's a credentials issue
      const errorMessage = error?.message || "Failed to initiate Twitter connection";
      if (errorMessage.includes("credentials not configured")) {
        toast({
          title: "Twitter OAuth Not Configured",
          description: "Twitter OAuth credentials are missing. Please contact support to enable Twitter connections.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
      console.error("Error connecting Twitter:", error);
    },
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
    onError: (error: any) => {
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

  const disconnectMutation = useMutation({
    mutationFn: async ({ provider, accountId }: { provider: string; accountId: string }) => {
      const response = await apiRequest("DELETE", `/api/social/accounts/${provider}/${accountId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/accounts"] });
      toast({
        title: "Account Disconnected",
        description: "Social account has been disconnected successfully.",
      });
    },
    onError: (error: any) => {
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
        description: "Failed to disconnect social account. Please try again.",
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

  const handleDisconnect = (provider: string, accountId: string) => {
    disconnectMutation.mutate({ provider, accountId });
  };

  return (
    <div className="flex min-h-screen bg-slate-50" data-testid="page-settings">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />

        <div className="p-6 space-y-6">
          {/* Social Account Connections */}
          <Card>
            <CardHeader className="border-b border-slate-200">
              <CardTitle className="text-lg font-semibold text-slate-800">
                Twitter/X Account Connection
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              {socialAccounts.length > 0 ? (
                <div className="space-y-4">
                  {socialAccounts.map((account: any) => (
                    <div 
                      key={`${account.provider}-${account.id}`}
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
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDisconnect(account.provider, account.id)}
                        data-testid={`button-disconnect-${account.provider}`}
                      >
                        Disconnect
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <p className="text-slate-600 text-center mb-4">
                    Connect your Twitter/X account to enable posting and analytics
                  </p>
                  <div className="flex justify-center">
                    <Button 
                      onClick={handleConnectTwitter}
                      disabled={connectTwitterMutation.isPending}
                      data-testid="button-connect-twitter"
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      {connectTwitterMutation.isPending ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Connecting...
                        </>
                      ) : (
                        <>
                          <i className="fab fa-twitter mr-2"></i>
                          Connect Twitter/X Account
                        </>
                      )}
                    </Button>
                  </div>
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