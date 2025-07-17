import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/layout/Navigation";
import ProgressDashboard from "@/components/progress/ProgressDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Target, Calendar, Award } from "lucide-react";

export default function Progress() {
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

  // Fetch user progress
  const { data: progress } = useQuery({
    queryKey: ["/api/progress"],
    retry: false,
  });

  // Fetch exercise sessions
  const { data: sessions } = useQuery({
    queryKey: ["/api/exercise-sessions"],
    retry: false,
  });

  // Fetch mood entries
  const { data: moodEntries } = useQuery({
    queryKey: ["/api/mood-entries"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-mom-pink rounded-2xl flex items-center justify-center mb-4 mx-auto animate-pulse">
            <TrendingUp className="text-white w-8 h-8" />
          </div>
          <p className="text-mom-gray">Loading your progress dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Calculate achievements
  const achievements = [];
  
  if ((progress?.totalSessions || 0) >= 1) {
    achievements.push({
      id: 1,
      title: "First Step",
      description: "Completed your first exercise session",
      icon: Target,
      color: "bg-green-100 text-green-600",
      unlocked: true
    });
  }

  if ((progress?.totalSessions || 0) >= 10) {
    achievements.push({
      id: 2,
      title: "Consistent Mover",
      description: "Completed 10 exercise sessions",
      icon: Award,
      color: "bg-blue-100 text-blue-600",
      unlocked: true
    });
  }

  if ((progress?.currentWeekSessions || 0) >= (progress?.weeklyExerciseGoal || 5)) {
    achievements.push({
      id: 3,
      title: "Weekly Champion",
      description: "Met your weekly exercise goal",
      icon: TrendingUp,
      color: "bg-mom-pink-light text-mom-pink",
      unlocked: true
    });
  }

  if ((moodEntries?.length || 0) >= 7) {
    achievements.push({
      id: 4,
      title: "Mindful Tracker",
      description: "Logged mood for 7 days",
      icon: Calendar,
      color: "bg-purple-100 text-purple-600",
      unlocked: true
    });
  }

  // Add locked achievements
  const lockedAchievements = [
    {
      id: 5,
      title: "Marathon Mover",
      description: "Complete 50 exercise sessions",
      icon: Award,
      color: "bg-gray-100 text-gray-400",
      unlocked: false,
      requirement: `${progress?.totalSessions || 0}/50 sessions`
    },
    {
      id: 6,
      title: "Streak Master",
      description: "Maintain a 30-day exercise streak",
      icon: TrendingUp,
      color: "bg-gray-100 text-gray-400",
      unlocked: false,
      requirement: `${progress?.streakDays || 0}/30 days`
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Progress Tracking</h1>
          <p className="text-mom-gray text-lg">
            Monitor your recovery journey and celebrate your achievements
          </p>
        </div>

        {/* Progress Dashboard */}
        <ProgressDashboard />

        {/* Achievements Section */}
        <Card className="border-mom-pink-light mb-8">
          <CardHeader>
            <CardTitle className="text-xl flex items-center space-x-2">
              <Award className="w-6 h-6 text-mom-pink" />
              <span>Achievements</span>
            </CardTitle>
            <p className="text-mom-gray">Milestones you've reached on your wellness journey</p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Unlocked Achievements */}
              {achievements.map((achievement) => {
                const IconComponent = achievement.icon;
                return (
                  <Card key={achievement.id} className="border-green-200 bg-green-50">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${achievement.color}`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">{achievement.title}</h3>
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              Unlocked
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700">{achievement.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Locked Achievements */}
              {lockedAchievements.map((achievement) => {
                const IconComponent = achievement.icon;
                return (
                  <Card key={achievement.id} className="border-gray-200 bg-gray-50">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${achievement.color}`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-gray-500">{achievement.title}</h3>
                            <Badge variant="outline" className="text-gray-500 border-gray-300">
                              Locked
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 mb-2">{achievement.description}</p>
                          <p className="text-xs text-gray-400">{achievement.requirement}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        {sessions && sessions.length > 0 && (
          <Card className="border-mom-pink-light">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <p className="text-mom-gray">Your latest exercise sessions and achievements</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.slice(0, 10).map((session) => (
                  <div key={session.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      (session.accuracy || 0) >= 80 ? 'bg-green-100' : 'bg-yellow-100'
                    }`}>
                      <Target className={`w-5 h-5 ${
                        (session.accuracy || 0) >= 80 ? 'text-green-600' : 'text-yellow-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{session.exerciseType}</h4>
                      <p className="text-sm text-mom-gray">
                        {new Date(session.createdAt!).toLocaleDateString()} • 
                        {Math.round((session.duration || 0) / 60)}m • 
                        {session.reps} reps
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        (session.accuracy || 0) >= 80 ? "default" : "secondary"
                      }>
                        {session.accuracy}% accuracy
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
