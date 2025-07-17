import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  Award, 
  Clock,
  Activity,
  Heart,
  Zap
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

export default function ProgressDashboard() {
  // Fetch user progress
  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ["/api/progress"],
    retry: false,
  });

  // Fetch exercise sessions
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/exercise-sessions"],
    retry: false,
  });

  // Fetch mood entries
  const { data: moodEntries, isLoading: moodLoading } = useQuery({
    queryKey: ["/api/mood-entries"],
    retry: false,
  });

  // Prepare chart data
  const prepareChartData = () => {
    if (!sessions || !moodEntries) return [];

    // Get last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayExercises = sessions.filter(s => 
        s.createdAt && s.createdAt.startsWith(date)
      );
      const dayMood = moodEntries.find(m => 
        m.createdAt && m.createdAt.startsWith(date)
      );

      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        exercises: dayExercises.length,
        avgAccuracy: dayExercises.length > 0 
          ? Math.round(dayExercises.reduce((acc, s) => acc + (s.accuracy || 0), 0) / dayExercises.length)
          : 0,
        mood: dayMood?.mood || 0,
        energy: dayMood?.energy || 0
      };
    });
  };

  const chartData = prepareChartData();

  // Calculate statistics
  const totalExerciseTime = sessions?.reduce((acc, session) => acc + (session.duration || 0), 0) || 0;
  const averageAccuracy = sessions?.length > 0 
    ? Math.round(sessions.reduce((acc, s) => acc + (s.accuracy || 0), 0) / sessions.length)
    : 0;
  const averageMood = moodEntries?.length > 0
    ? Math.round(moodEntries.reduce((acc, m) => acc + m.mood, 0) / moodEntries.length)
    : 0;
  const weeklyGoalProgress = progress?.weeklyExerciseGoal > 0
    ? Math.round(((progress.currentWeekSessions || 0) / progress.weeklyExerciseGoal) * 100)
    : 0;

  if (progressLoading || sessionsLoading || moodLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-mom-pink-light">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-100 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-mom-pink-light">
            <CardContent className="p-6">
              <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
            </CardContent>
          </Card>
          <Card className="border-mom-pink-light">
            <CardContent className="p-6">
              <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-mom-pink-light">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-mom-gray">Weekly Goal</p>
                <p className="text-2xl font-bold text-gray-900">
                  {progress?.currentWeekSessions || 0}/{progress?.weeklyExerciseGoal || 5}
                </p>
                <p className="text-sm text-mom-gray mt-1">
                  {weeklyGoalProgress}% complete
                </p>
              </div>
              <div className="w-12 h-12 bg-mom-pink-light rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-mom-pink" />
              </div>
            </div>
            <Progress value={weeklyGoalProgress} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="border-mom-pink-light">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-mom-gray">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {progress?.totalSessions || 0}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  Keep it up!
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-mom-pink-light">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-mom-gray">Exercise Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(totalExerciseTime / 60)}m
                </p>
                <p className="text-sm text-mom-gray mt-1">
                  Total minutes
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-mom-pink-light">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-mom-gray">Avg. Mood</p>
                <p className="text-2xl font-bold text-gray-900">
                  {averageMood}/10
                </p>
                <Badge variant={
                  averageMood >= 7 ? "default" : 
                  averageMood >= 5 ? "secondary" : "outline"
                } className="mt-1">
                  {averageMood >= 7 ? "Great" : 
                   averageMood >= 5 ? "Good" : "Needs attention"}
                </Badge>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Exercise Progress Chart */}
        <Card className="border-mom-pink-light">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-mom-pink" />
              <span>Weekly Exercise Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #D688A3',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="exercises" fill="#D688A3" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Mood & Energy Trends */}
        <Card className="border-mom-pink-light">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-mom-pink" />
              <span>Mood & Energy Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #D688A3',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="mood" 
                    stroke="#D688A3" 
                    strokeWidth={2}
                    dot={{ fill: '#D688A3', strokeWidth: 2, r: 4 }}
                    name="Mood"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="energy" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    name="Energy"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Progress */}
      <Card className="border-mom-pink-light">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-mom-pink" />
            <span>Progress Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Exercise Metrics</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-mom-gray">Average Accuracy</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={averageAccuracy} className="w-20" />
                    <span className="text-sm font-medium">{averageAccuracy}%</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-mom-gray">Consistency Score</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={weeklyGoalProgress} className="w-20" />
                    <span className="text-sm font-medium">{weeklyGoalProgress}%</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-mom-gray">Current Streak</span>
                  <Badge variant="outline">
                    {progress?.streakDays || 0} days
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Wellness Metrics</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-mom-gray">Mood Entries</span>
                  <span className="text-sm font-medium">{moodEntries?.length || 0} logged</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-mom-gray">Average Mood</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={averageMood * 10} className="w-20" />
                    <span className="text-sm font-medium">{averageMood}/10</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-mom-gray">Wellness Score</span>
                  <Badge variant={averageMood >= 7 ? "default" : "secondary"}>
                    {averageMood >= 7 ? "Excellent" : 
                     averageMood >= 5 ? "Good" : "Improving"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
