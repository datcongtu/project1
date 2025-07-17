import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/layout/Navigation";
import CameraExercise from "@/components/camera/CameraExercise";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, MessageSquare, TrendingUp, Calendar, Camera } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

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

  // Fetch user progress
  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ["/api/progress"],
    retry: false,
  });

  // Fetch latest mood entry
  const { data: latestMood } = useQuery({
    queryKey: ["/api/mood-entries/latest"],
    retry: false,
  });

  // Fetch latest chat conversation
  const { data: latestChat } = useQuery({
    queryKey: ["/api/chat/conversations/latest"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-mom-pink rounded-2xl flex items-center justify-center mb-4 mx-auto animate-pulse">
            <Camera className="text-white w-8 h-8" />
          </div>
          <p className="text-mom-gray">Loading your wellness dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, <span className="text-mom-pink">{user?.firstName || 'Amazing Mom'}</span>
          </h1>
          <p className="text-mom-gray text-lg">Ready for today's wellness journey? Let's embrace your new you.</p>
        </div>

        {/* Camera Exercise Section */}
        <CameraExercise />

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/wellness">
            <Card className="border-mom-pink-light hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="text-blue-600 w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Mental Wellness</h3>
                <p className="text-sm text-mom-gray mb-4">Psychological support and mood tracking</p>
                <Button variant="ghost" className="text-mom-pink text-sm font-medium hover:text-mom-pink-accent p-0">
                  Start Session →
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/chat">
            <Card className="border-mom-pink-light hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="text-green-600 w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">AI Assistant</h3>
                <p className="text-sm text-mom-gray mb-4">24/7 personalized support and guidance</p>
                <Button variant="ghost" className="text-mom-pink text-sm font-medium hover:text-mom-pink-accent p-0">
                  Chat Now →
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/progress">
            <Card className="border-mom-pink-light hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-mom-pink-light rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="text-mom-pink w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Progress Tracking</h3>
                <p className="text-sm text-mom-gray mb-4">Monitor your recovery journey</p>
                <Button variant="ghost" className="text-mom-pink text-sm font-medium hover:text-mom-pink-accent p-0">
                  View Progress →
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Card className="border-mom-pink-light hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="text-orange-600 w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Appointments</h3>
              <p className="text-sm text-mom-gray mb-4">Schedule with healthcare providers</p>
              <Button variant="ghost" className="text-mom-pink text-sm font-medium hover:text-mom-pink-accent p-0">
                Book Now →
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Today's Plan Section */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Daily Schedule */}
          <div className="lg:col-span-2">
            <Card className="border-mom-pink-light">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Today's Wellness Plan</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 bg-mom-pink-light rounded-lg">
                    <div className="w-3 h-3 bg-mom-pink rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Morning Exercise Session</div>
                      <div className="text-sm text-mom-gray">Pelvic floor strengthening • 20 mins</div>
                    </div>
                    <div className="text-sm text-mom-gray">9:00 AM</div>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Mindfulness Session</div>
                      <div className="text-sm text-mom-gray">Guided meditation • 15 mins</div>
                    </div>
                    <div className="text-sm text-mom-gray">2:00 PM</div>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Nutrition Check-in</div>
                      <div className="text-sm text-mom-gray">Log meals and water intake</div>
                    </div>
                    <div className="text-sm text-mom-gray">6:00 PM</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            {/* Weekly Progress */}
            <Card className="border-mom-pink-light">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4">This Week's Progress</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-mom-gray">Exercise Sessions</span>
                      <span className="font-medium">
                        {progress?.currentWeekSessions || 0}/{progress?.weeklyExerciseGoal || 5}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-mom-pink h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min(100, ((progress?.currentWeekSessions || 0) / (progress?.weeklyExerciseGoal || 5)) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-mom-gray">Wellness Activities</span>
                      <span className="font-medium">6/7</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: "86%" }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Assistant Preview */}
            <Card className="border-mom-pink-light">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">AI Assistant</h4>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse-soft"></div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    {latestChat?.messages ? 
                      "Hi! Ready for today's exercise session? I noticed you've been doing great with consistency this week. 💪" :
                      "Hi there! I'm here to support you on your wellness journey. How can I help you today?"
                    }
                  </p>
                </div>
                <Link href="/chat">
                  <Button className="w-full bg-mom-pink text-white hover:bg-mom-pink-accent">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Continue Chat
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Floating Camera Toggle */}
      <Button 
        onClick={() => {
          document.querySelector('.camera-exercise-section')?.scrollIntoView({ 
            behavior: 'smooth' 
          });
        }}
        className="fixed bottom-6 right-6 bg-mom-pink text-white w-14 h-14 rounded-full shadow-lg hover:bg-mom-pink-accent transition-colors"
      >
        <Camera className="w-6 h-6" />
      </Button>
    </div>
  );
}
