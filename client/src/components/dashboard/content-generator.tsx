import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import ScheduleModal from "@/components/modals/schedule-modal";

export default function ContentGenerator() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userTopics = [] } = useQuery<any[]>({
    queryKey: ["/api/user-topics"],
  });

  const { data: twitterAccounts = [] } = useQuery<any[]>({
    queryKey: ["/api/twitter/accounts"],
  });

  const generateContentMutation = useMutation({
    mutationFn: async (params: any) => {
      const response = await apiRequest("POST", "/api/generate-content", params);
      return await response.json();
    },
    onSuccess: (data) => {
      setGeneratedContent(data.content[0]);
      toast({
        title: "Content Generated",
        description: "New tweet content has been generated!",
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
        title: "Generation Failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveTweetMutation = useMutation({
    mutationFn: async (tweetData: any) => {
      const response = await apiRequest("POST", "/api/tweets", tweetData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tweets"] });
      toast({
        title: "Tweet Saved",
        description: "Tweet has been saved as draft!",
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
        title: "Save Failed",
        description: "Failed to save tweet. Please try again.",
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

  const handleGenerate = () => {
    const topicIds = selectedTopics.length > 0 
      ? selectedTopics 
      : userTopics.slice(0, 2).map((ut: any) => ut.topicId);
    
    if (topicIds.length === 0) {
      toast({
        title: "No Topics Available",
        description: "Please set up your content topics in settings first.",
        variant: "destructive",
      });
      return;
    }

    generateContentMutation.mutate({
      topicIds,
      style: 'engaging',
      length: 'medium',
      includeHashtags: true,
      includeEmojis: true,
      count: 1,
    });
  };

  const handleSaveDraft = () => {
    if (!generatedContent) return;
    
    if (twitterAccounts.length === 0) {
      toast({
        title: "No Twitter Account",
        description: "Please connect a Twitter account first.",
        variant: "destructive",
      });
      return;
    }

    saveTweetMutation.mutate({
      content: generatedContent.content,
      twitterAccountId: twitterAccounts[0].id,
      status: 'draft',
      approvalStatus: 'pending',
      topics: selectedTopics,
    });
  };

  return (
    <Card data-testid="content-generator">
      <CardHeader className="border-b border-slate-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-800">
            AI Content Generator
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = '/settings'}
            data-testid="button-configure"
          >
            <i className="fas fa-cog mr-1"></i>
            Configure
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Topic Selection */}
        <div>
          <Label className="block text-sm font-medium text-slate-700 mb-3">
            Select Topics
          </Label>
          <div className="flex flex-wrap gap-2">
            {userTopics.slice(0, 5).map((userTopic: any) => {
              const isSelected = selectedTopics.includes(userTopic.topicId);
              return (
                <button
                  key={userTopic.topicId}
                  onClick={() => handleTopicToggle(userTopic.topicId)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  data-testid={`topic-${userTopic.topic.name.toLowerCase()}`}
                >
                  <i className={`${userTopic.topic.icon} mr-1`}></i>
                  {userTopic.topic.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Preview */}
        {generatedContent ? (
          <div className="bg-slate-50 rounded-lg p-4" data-testid="generated-content">
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-medium text-slate-800">Generated Content</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={generateContentMutation.isPending}
                data-testid="button-regenerate"
              >
                <i className="fas fa-sync-alt mr-1"></i>
                Regenerate
              </Button>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <p className="text-slate-800" data-testid="text-generated-content">
                {generatedContent.content}
              </p>
              <div className="flex items-center justify-between mt-3 text-sm text-slate-500">
                <span data-testid="text-character-count">
                  Characters: {generatedContent.character_count}/280
                </span>
                <div className="flex space-x-4">
                  <span>📈 Score: {generatedContent.engagement_score}/10</span>
                  <span>🎯 {generatedContent.hashtags?.length || 0} hashtags</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3 mt-4">
              <Button 
                className="flex-1"
                onClick={() => setShowScheduleModal(true)}
                data-testid="button-schedule"
              >
                <i className="fas fa-calendar-plus mr-2"></i>
                Schedule Tweet
              </Button>
              <Button 
                variant="outline"
                onClick={handleSaveDraft}
                disabled={saveTweetMutation.isPending}
                data-testid="button-save-draft"
              >
                <i className="fas fa-save mr-2"></i>
                Save Draft
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-center py-8">
              <i className="fas fa-robot text-slate-400 text-3xl mb-4"></i>
              <h4 className="font-medium text-slate-800 mb-2">Generate Your First Tweet</h4>
              <p className="text-slate-600 text-sm mb-6">
                Click generate to create AI-powered content based on your selected topics.
              </p>
              <Button 
                onClick={handleGenerate}
                disabled={generateContentMutation.isPending}
                data-testid="button-generate"
              >
                {generateContentMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Generating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-magic mr-2"></i>
                    Generate Content
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        tweetContent={generatedContent}
        topicIds={selectedTopics}
      />
    </Card>
  );
}
