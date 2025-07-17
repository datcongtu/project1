import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/layout/Navigation";
import MoodTracker from "@/components/wellness/MoodTracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Brain, Heart, Smile, TrendingUp, Book, Headphones, Calendar } from "lucide-react";

export default function Wellness() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  // Fetch mood entries
  const { data: moodEntries, isLoading: moodLoading } = useQuery({
    queryKey: ["/api/mood-entries"],
    retry: false,
  });

  const wellnessResources = [
    {
      id: 1,
      title: "Postpartum Depression Awareness",
      description: "Understanding signs, symptoms, and when to seek help",
      type: "Article",
      duration: "10 min read",
      category: "Mental Health",
      icon: Brain,
      color: "blue"
    },
    {
      id: 2,
      title: "Guided Meditation for New Mothers",
      description: "Calming meditation sessions designed for postpartum relaxation",
      type: "Audio",
      duration: "15 min",
      category: "Mindfulness",
      icon: Headphones,
      color: "green"
    },
    {
      id: 3,
      title: "Body Image and Self-Acceptance",
      description: "Embracing your changing body with love and compassion",
      type: "Article",
      duration: "8 min read", 
      category: "Self-Care",
      icon: Heart,
      color: "pink"
    },
    {
      id: 4,
      title: "Sleep Strategies for New Moms",
      description: "Practical tips for better rest despite disrupted schedules",
      type: "Guide",
      duration: "12 min read",
      category: "Wellness",
      icon: Book,
      color: "purple"
    },
    {
      id: 5,
      title: "Managing Anxiety and Overwhelm",
      description: "Coping strategies for when motherhood feels overwhelming",
      type: "Article",
      duration: "15 min read",
      category: "Mental Health",
      icon: Brain,
      color: "blue"
    },
    {
      id: 6,
      title: "Breathing Exercises for Stress Relief",
      description: "Simple breathing techniques to reduce stress and anxiety",
      type: "Audio",
      duration: "10 min",
      category: "Mindfulness",
      icon: Headphones,
      color: "green"
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-mom-pink rounded-2xl flex items-center justify-center mb-4 mx-auto animate-pulse">
            <Brain className="text-white w-8 h-8" />
          </div>
          <p className="text-mom-gray">Loading your wellness dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600", 
      pink: "bg-pink-100 text-pink-600",
      purple: "bg-purple-100 text-purple-600"
    };
    return colorMap[color as keyof typeof colorMap] || "bg-gray-100 text-gray-600";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mental Wellness</h1>
          <p className="text-mom-gray text-lg">
            Your psychological health matters. Track your mood and access resources for emotional well-being.
          </p>
        </div>

        {/* Mood Tracker Section */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <MoodTracker />
          </div>
          
          {/* Quick Stats */}
          <div className="space-y-6">
            <Card className="border-mom-pink-light">
              <CardHeader>
                <CardTitle className="text-lg">Mood Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-mom-gray">This Week</span>
                    <div className="flex items-center space-x-2">
                      <Smile className="w-4 h-4 text-green-500" />
                      <span className="font-medium">
                        {moodEntries && moodEntries.length > 0 ? 
                          Math.round(moodEntries.slice(0, 7).reduce((acc, entry) => acc + entry.mood, 0) / Math.min(7, moodEntries.length)) : 
                          'No data'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-mom-gray">Energy Level</span>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">
                        {moodEntries && moodEntries.length > 0 ? 
                          Math.round(moodEntries.slice(0, 7).reduce((acc, entry) => acc + (entry.energy || 0), 0) / Math.min(7, moodEntries.length)) : 
                          'No data'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-mom-gray">Entries This Week</span>
                    <span className="font-medium">{moodEntries?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-mom-pink-light">
              <CardContent className="p-6">
                <div className="text-center">
                  <Calendar className="w-8 h-8 text-mom-pink mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Need Support?</h3>
                  <p className="text-sm text-mom-gray mb-4">
                    Connect with a mental health professional
                  </p>
                  <Button className="w-full bg-mom-pink hover:bg-mom-pink-accent text-white">
                    Schedule Consultation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Wellness Resources */}
        <Card className="border-mom-pink-light mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Wellness Resources</CardTitle>
            <p className="text-mom-gray">Expert-curated content to support your mental health journey</p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wellnessResources.map((resource) => {
                const IconComponent = resource.icon;
                return (
                  <Card key={resource.id} className="border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getColorClasses(resource.color)}`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-gray-900 text-sm leading-tight">{resource.title}</h3>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {resource.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-mom-gray mb-3 leading-relaxed">{resource.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-mom-gray">{resource.duration}</span>
                            <Badge variant="secondary" className="text-xs">
                              {resource.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Emergency Resources */}
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Crisis Support</h3>
                <p className="text-sm text-gray-700 mb-4">
                  If you're experiencing thoughts of self-harm or suicide, please reach out for immediate help.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                    Crisis Text Line: Text HOME to 741741
                  </Button>
                  <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                    National Suicide Prevention: 988
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
