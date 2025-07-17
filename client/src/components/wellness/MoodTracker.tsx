import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Smile, Frown, Meh, Heart, Battery, AlertCircle } from "lucide-react";

interface MoodData {
  mood: number;
  energy: number;
  anxiety: number;
  notes: string;
}

export default function MoodTracker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [moodData, setMoodData] = useState<MoodData>({
    mood: 5,
    energy: 5,
    anxiety: 5,
    notes: ""
  });

  // Fetch recent mood entries
  const { data: moodEntries, isLoading } = useQuery({
    queryKey: ["/api/mood-entries"],
    retry: false,
  });

  // Create mood entry mutation
  const createMoodMutation = useMutation({
    mutationFn: async (data: MoodData) => {
      return await apiRequest('POST', '/api/mood-entries', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mood-entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/mood-entries/latest'] });
      setMoodData({ mood: 5, energy: 5, anxiety: 5, notes: "" });
      toast({
        title: "Mood Logged Successfully",
        description: "Thank you for sharing how you're feeling today.",
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
        title: "Error",
        description: "Failed to log mood entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMoodMutation.mutate(moodData);
  };

  const getMoodIcon = (value: number) => {
    if (value <= 3) return <Frown className="w-5 h-5 text-red-500" />;
    if (value <= 7) return <Meh className="w-5 h-5 text-yellow-500" />;
    return <Smile className="w-5 h-5 text-green-500" />;
  };

  const getMoodColor = (value: number) => {
    if (value <= 3) return "bg-red-100 border-red-200";
    if (value <= 7) return "bg-yellow-100 border-yellow-200";
    return "bg-green-100 border-green-200";
  };

  const ScaleSelector = ({ 
    label, 
    value, 
    onChange, 
    icon: Icon,
    lowLabel,
    highLabel,
    color 
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    icon: any;
    lowLabel: string;
    highLabel: string;
    color: string;
  }) => (
    <div className="space-y-3">
      <Label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
        <Icon className={`w-4 h-4 ${color}`} />
        <span>{label}</span>
      </Label>
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-500">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => onChange(num)}
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-colors ${
                value === num
                  ? 'bg-mom-pink border-mom-pink text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-mom-pink-light'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Mood Entry Form */}
      <Card className="border-mom-pink-light">
        <CardHeader>
          <CardTitle className="text-xl flex items-center space-x-2">
            <Heart className="w-6 h-6 text-mom-pink" />
            <span>How are you feeling today?</span>
          </CardTitle>
          <p className="text-mom-gray">
            Track your emotional well-being to better understand your postpartum journey
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <ScaleSelector
              label="Overall Mood"
              value={moodData.mood}
              onChange={(value) => setMoodData(prev => ({ ...prev, mood: value }))}
              icon={Heart}
              lowLabel="Very Low"
              highLabel="Excellent"
              color="text-mom-pink"
            />

            <ScaleSelector
              label="Energy Level"
              value={moodData.energy}
              onChange={(value) => setMoodData(prev => ({ ...prev, energy: value }))}
              icon={Battery}
              lowLabel="Exhausted"
              highLabel="Energized"
              color="text-blue-500"
            />

            <ScaleSelector
              label="Anxiety Level"
              value={moodData.anxiety}
              onChange={(value) => setMoodData(prev => ({ ...prev, anxiety: value }))}
              icon={AlertCircle}
              lowLabel="Very Calm"
              highLabel="Very Anxious"
              color="text-orange-500"
            />

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="How are you feeling today? What's on your mind?"
                value={moodData.notes}
                onChange={(e) => setMoodData(prev => ({ ...prev, notes: e.target.value }))}
                className="min-h-[100px] resize-none"
              />
            </div>

            <Button
              type="submit"
              disabled={createMoodMutation.isPending}
              className="w-full bg-mom-pink hover:bg-mom-pink-accent text-white"
            >
              {createMoodMutation.isPending ? "Saving..." : "Log Mood Entry"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Mood Entries */}
      <Card className="border-mom-pink-light">
        <CardHeader>
          <CardTitle>Recent Mood Entries</CardTitle>
          <p className="text-mom-gray">Track your emotional patterns over time</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : moodEntries && moodEntries.length > 0 ? (
            <div className="space-y-3">
              {moodEntries.slice(0, 7).map((entry: any) => (
                <div
                  key={entry.id}
                  className={`p-4 rounded-lg border ${getMoodColor(entry.mood)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getMoodIcon(entry.mood)}
                      <span className="font-medium text-gray-900">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Mood: {entry.mood}/10</span>
                      {entry.energy && <span>Energy: {entry.energy}/10</span>}
                      {entry.anxiety && <span>Anxiety: {entry.anxiety}/10</span>}
                    </div>
                  </div>
                  {entry.notes && (
                    <p className="text-sm text-gray-700 italic">"{entry.notes}"</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No mood entries yet</p>
              <p className="text-sm text-gray-400">
                Start tracking your mood to see patterns and insights over time
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
