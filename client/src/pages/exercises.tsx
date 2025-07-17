import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/layout/Navigation";
import CameraExercise from "@/components/camera/CameraExercise";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Clock, Target, TrendingUp, Play } from "lucide-react";

export default function Exercises() {
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

  // Fetch exercise sessions
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/exercise-sessions"],
    retry: false,
  });

  const exerciseLibrary = [
    {
      id: 1,
      name: "Pelvic Tilts",
      description: "Gentle pelvic floor strengthening exercise",
      duration: "10-15 minutes",
      difficulty: "Beginner",
      category: "Core Strengthening",
      benefits: ["Improves posture", "Strengthens core", "Reduces back pain"],
      instructions: [
        "Lie on your back with knees bent",
        "Gently tilt pelvis forward",
        "Hold for 3-5 seconds",
        "Release and repeat"
      ]
    },
    {
      id: 2,
      name: "Bridge Poses",
      description: "Strengthen glutes and lower back",
      duration: "15-20 minutes",
      difficulty: "Beginner",
      category: "Strength Training",
      benefits: ["Strengthens glutes", "Improves stability", "Enhances posture"],
      instructions: [
        "Lie on back with knees bent",
        "Lift hips off the ground",
        "Form straight line from knees to shoulders",
        "Hold and lower slowly"
      ]
    },
    {
      id: 3,
      name: "Modified Planks",
      description: "Core strengthening for postpartum recovery",
      duration: "5-10 minutes",
      difficulty: "Intermediate",
      category: "Core Strengthening",
      benefits: ["Builds core strength", "Improves stability", "Reduces diastasis recti"],
      instructions: [
        "Start on hands and knees",
        "Hold straight line from head to knees",
        "Engage core muscles",
        "Hold for 10-30 seconds"
      ]
    },
    {
      id: 4,
      name: "Gentle Squats",
      description: "Lower body strengthening exercise",
      duration: "10-15 minutes",
      difficulty: "Beginner",
      category: "Strength Training",
      benefits: ["Strengthens legs", "Improves mobility", "Enhances functional movement"],
      instructions: [
        "Stand with feet hip-width apart",
        "Lower body as if sitting in chair",
        "Keep knees behind toes",
        "Return to standing position"
      ]
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-mom-pink rounded-2xl flex items-center justify-center mb-4 mx-auto animate-pulse">
            <Target className="text-white w-8 h-8" />
          </div>
          <p className="text-mom-gray">Loading your exercise library...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Exercise Library</h1>
          <p className="text-mom-gray text-lg">
            Safe, effective exercises designed specifically for postpartum recovery
          </p>
        </div>

        {/* Camera Exercise Section */}
        <div className="camera-exercise-section">
          <CameraExercise />
        </div>

        {/* Exercise Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-mom-pink-light">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-mom-gray">Total Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {sessions?.length || 0}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-mom-pink" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-mom-pink-light">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-mom-gray">Average Accuracy</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {sessions?.length > 0 
                      ? Math.round(sessions.reduce((acc, s) => acc + (s.accuracy || 0), 0) / sessions.length)
                      : 0}%
                  </p>
                </div>
                <Target className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-mom-pink-light">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-mom-gray">Total Time</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {sessions?.length > 0 
                      ? Math.round(sessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60)
                      : 0}m
                  </p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exercise Library Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {exerciseLibrary.map((exercise) => (
            <Card key={exercise.id} className="border-mom-pink-light hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl text-gray-900 mb-2">{exercise.name}</CardTitle>
                    <p className="text-mom-gray">{exercise.description}</p>
                  </div>
                  <Badge 
                    variant={exercise.difficulty === 'Beginner' ? 'secondary' : 'outline'}
                    className="ml-2"
                  >
                    {exercise.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 text-sm text-mom-gray">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{exercise.duration}</span>
                    </div>
                    <Badge variant="outline">{exercise.category}</Badge>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Benefits</h4>
                    <ul className="text-sm text-mom-gray space-y-1">
                      {exercise.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-mom-pink rounded-full"></div>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Instructions</h4>
                    <ol className="text-sm text-mom-gray space-y-1">
                      {exercise.instructions.map((instruction, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="w-5 h-5 bg-mom-pink-light text-mom-pink rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                            {index + 1}
                          </span>
                          <span>{instruction}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <Button 
                    className="w-full bg-mom-pink hover:bg-mom-pink-accent text-white"
                    onClick={() => {
                      document.querySelector('.camera-exercise-section')?.scrollIntoView({ 
                        behavior: 'smooth' 
                      });
                    }}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Exercise
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Sessions */}
        {sessions && sessions.length > 0 && (
          <Card className="border-mom-pink-light">
            <CardHeader>
              <CardTitle>Recent Exercise Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.slice(0, 5).map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{session.exerciseType}</h4>
                      <p className="text-sm text-mom-gray">
                        {new Date(session.createdAt!).toLocaleDateString()} • {Math.round((session.duration || 0) / 60)}m
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">{session.accuracy}% accuracy</p>
                      <p className="text-sm text-mom-gray">{session.reps} reps</p>
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
