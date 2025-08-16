import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  tweetContent: any;
  topicIds: string[];
}

export default function ScheduleModal({ 
  isOpen, 
  onClose, 
  tweetContent,
  topicIds 
}: ScheduleModalProps) {
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: twitterAccounts = [] } = useQuery({
    queryKey: ["/api/twitter/accounts"],
  });

  const scheduleTweetMutation = useMutation({
    mutationFn: async (tweetData: any) => {
      const response = await apiRequest("POST", "/api/tweets", tweetData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tweets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-stats"] });
      toast({
        title: "Tweet Scheduled",
        description: "Your tweet has been scheduled successfully!",
      });
      onClose();
      // Reset form
      setScheduledDate('');
      setScheduledTime('');
      setRepeatWeekly(false);
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
        title: "Scheduling Failed",
        description: "Failed to schedule tweet. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSchedule = () => {
    if (!tweetContent) {
      toast({
        title: "No Content",
        description: "No content to schedule.",
        variant: "destructive",
      });
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      toast({
        title: "Missing Schedule",
        description: "Please select both date and time.",
        variant: "destructive",
      });
      return;
    }

    if (twitterAccounts.length === 0) {
      toast({
        title: "No Twitter Account",
        description: "Please connect a Twitter account first.",
        variant: "destructive",
      });
      return;
    }

    const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`);
    const now = new Date();

    if (scheduledFor <= now) {
      toast({
        title: "Invalid Schedule",
        description: "Please select a future date and time.",
        variant: "destructive",
      });
      return;
    }

    scheduleTweetMutation.mutate({
      content: tweetContent.content,
      twitterAccountId: twitterAccounts[0].id,
      scheduledFor: scheduledFor.toISOString(),
      status: 'scheduled',
      approvalStatus: 'approved',
      topics: topicIds,
    });
  };

  const getMinDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMinTime = () => {
    const now = new Date();
    const today = new Date().toDateString();
    const selectedDay = new Date(scheduledDate).toDateString();
    
    if (today === selectedDay) {
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes() + 1).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    return '00:00';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" data-testid="schedule-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Schedule Tweet
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Tweet Preview */}
          {tweetContent && (
            <div className="bg-slate-50 p-4 rounded-lg border">
              <Label className="text-sm font-medium text-slate-700 mb-2 block">
                Tweet Preview
              </Label>
              <p className="text-sm text-slate-800" data-testid="preview-content">
                {tweetContent.content}
              </p>
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>{tweetContent.character_count}/280 characters</span>
                <span>Score: {tweetContent.engagement_score}/10</span>
              </div>
            </div>
          )}
          
          {/* Date and Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="schedule-date" className="block text-sm font-medium text-slate-700 mb-2">
                Date
              </Label>
              <Input
                id="schedule-date"
                type="date"
                value={scheduledDate}
                min={getMinDateTime()}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full"
                data-testid="input-date"
              />
            </div>
            <div>
              <Label htmlFor="schedule-time" className="block text-sm font-medium text-slate-700 mb-2">
                Time
              </Label>
              <Input
                id="schedule-time"
                type="time"
                value={scheduledTime}
                min={scheduledDate ? getMinTime() : '00:00'}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full"
                data-testid="input-time"
              />
            </div>
          </div>
          
          {/* Repeat Options */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="repeat-weekly"
              checked={repeatWeekly}
              onCheckedChange={setRepeatWeekly}
              data-testid="checkbox-repeat"
            />
            <Label htmlFor="repeat-weekly" className="text-sm text-slate-700">
              Repeat weekly
            </Label>
          </div>
          
          {repeatWeekly && (
            <div className="text-xs text-slate-500 bg-blue-50 p-3 rounded">
              <i className="fas fa-info-circle mr-1"></i>
              This feature will be available in a future update.
            </div>
          )}
        </div>
        
        <div className="flex space-x-3 pt-4 border-t">
          <Button 
            className="flex-1"
            onClick={handleSchedule}
            disabled={scheduleTweetMutation.isPending}
            data-testid="button-confirm-schedule"
          >
            {scheduleTweetMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Scheduling...
              </>
            ) : (
              <>
                <i className="fas fa-calendar-plus mr-2"></i>
                Schedule Tweet
              </>
            )}
          </Button>
          <Button 
            variant="outline"
            onClick={onClose}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
