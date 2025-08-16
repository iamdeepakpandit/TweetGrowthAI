import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import ScheduleModal from "@/components/modals/schedule-modal";

export default function ContentGenerator() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [style, setStyle] = useState<string>('engaging');
  const [length, setLength] = useState<string>('medium');
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [generatedContent, setGeneratedContent] = useState<any[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedContentIndex, setSelectedContentIndex] = useState(0);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contentTopics = [] } = useQuery({
    queryKey: ["/api/content-topics"],
  });

  const { data: userTopics = [] } = useQuery({
    queryKey: ["/api/user-topics"],
  });

  const { data: twitterAccounts = [] } = useQuery({
    queryKey: ["/api/twitter/accounts"],
  });

  const generateContentMutation = useMutation({
    mutationFn: async (params: any) => {
      const response = await apiRequest("POST", "/api/generate-content", params);
      return await response.json();
    },
    onSuccess: (data) => {
      setGeneratedContent(data.content);
      toast({
        title: "Content Generated",
        description: "New tweet content has been generated successfully!",
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
        description: "Tweet has been saved as draft successfully!",
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
    if (selectedTopics.length === 0) {
      toast({
        title: "No Topics Selected",
        description: "Please select at least one topic to generate content.",
        variant: "destructive",
      });
      return;
    }

    generateContentMutation.mutate({
      topicIds: selectedTopics,
      style,
      length,
      includeHashtags,
      includeEmojis,
      count: 3,
    });
  };

  const handleScheduleClick = (index: number) => {
    setSelectedContentIndex(index);
    setShowScheduleModal(true);
  };

  const handleSaveDraft = (content: any) => {
    if (twitterAccounts.length === 0) {
      toast({
        title: "No Twitter Account",
        description: "Please connect a Twitter account first.",
        variant: "destructive",
      });
      return;
    }

    saveTweetMutation.mutate({
      content: content.content,
      twitterAccountId: twitterAccounts[0].id,
      status: 'draft',
      approvalStatus: 'pending',
      topics: selectedTopics,
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50" data-testid="page-content-generator">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        
        <div className="p-6">
          <Card>
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
                  {contentTopics.map((topic: any) => {
                    const isSelected = selectedTopics.includes(topic.id);
                    return (
                      <button
                        key={topic.id}
                        onClick={() => handleTopicToggle(topic.id)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        data-testid={`topic-${topic.name.toLowerCase()}`}
                      >
                        <i className={`${topic.icon} mr-1`}></i>
                        {topic.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Generation Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="block text-sm font-medium text-slate-700 mb-2">
                    Style
                  </Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger data-testid="select-style">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="engaging">Engaging</SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="block text-sm font-medium text-slate-700 mb-2">
                    Length
                  </Label>
                  <Select value={length} onValueChange={setLength}>
                    <SelectTrigger data-testid="select-length">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (&lt;150 chars)</SelectItem>
                      <SelectItem value="medium">Medium (150-220 chars)</SelectItem>
                      <SelectItem value="long">Long (220-280 chars)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hashtags"
                    checked={includeHashtags}
                    onCheckedChange={(checked) => setIncludeHashtags(!!checked)}
                    data-testid="checkbox-hashtags"
                  />
                  <Label htmlFor="hashtags" className="text-sm text-slate-700">
                    Include Hashtags
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="emojis"
                    checked={includeEmojis}
                    onCheckedChange={(checked) => setIncludeEmojis(!!checked)}
                    data-testid="checkbox-emojis"
                  />
                  <Label htmlFor="emojis" className="text-sm text-slate-700">
                    Include Emojis
                  </Label>
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex justify-center">
                <Button 
                  onClick={handleGenerate}
                  disabled={generateContentMutation.isPending}
                  className="min-w-48"
                  data-testid="button-generate"
                >
                  {generateContentMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Generating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-robot mr-2"></i>
                      Generate Content
                    </>
                  )}
                </Button>
              </div>

              {/* Generated Content */}
              {generatedContent.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-800">Generated Content</h4>
                  {generatedContent.map((content, index) => (
                    <div 
                      key={index}
                      className="bg-slate-50 rounded-lg p-4 border border-slate-200"
                      data-testid={`generated-content-${index}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <p className="text-slate-800 flex-1">{content.content}</p>
                        <div className="ml-4 text-sm text-slate-500">
                          <span data-testid={`character-count-${index}`}>
                            {content.character_count}/280
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                        <div className="flex space-x-4">
                          <span>📈 Score: {content.engagement_score}/10</span>
                          <span>🎯 {content.hashtags?.length || 0} hashtags</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-3">
                        <Button 
                          onClick={() => handleScheduleClick(index)}
                          className="flex-1"
                          data-testid={`button-schedule-${index}`}
                        >
                          <i className="fas fa-calendar-plus mr-2"></i>
                          Schedule Tweet
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => handleSaveDraft(content)}
                          data-testid={`button-save-draft-${index}`}
                        >
                          <i className="fas fa-save mr-2"></i>
                          Save Draft
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        tweetContent={generatedContent[selectedContentIndex]}
        topicIds={selectedTopics}
      />
    </div>
  );
}
