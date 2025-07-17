import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Camera, 
  Play, 
  Pause, 
  Square, 
  AlertTriangle, 
  RefreshCw,
  CheckCircle,
  Settings
} from "lucide-react";
import PoseDetection from "./PoseDetection";
import { initializeCamera, getCameraConstraints } from "@/lib/mediaUtils";

interface ExerciseData {
  exerciseType: string;
  duration: number;
  reps: number;
  accuracy: number;
  postureScore: number;
  notes?: string;
}

export default function CameraExercise() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Camera refs and state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Exercise state
  const [cameraState, setCameraState] = useState<'permission' | 'loading' | 'active' | 'error'>('permission');
  const [exerciseState, setExerciseState] = useState<'idle' | 'active' | 'paused'>('idle');
  const [exerciseStartTime, setExerciseStartTime] = useState<number | null>(null);
  const [exerciseTimer, setExerciseTimer] = useState(0);
  const [currentExercise] = useState('Pelvic Tilts');
  const [postureScore, setPostureScore] = useState(85);
  const [repCount, setRepCount] = useState(0);
  const [cameraError, setCameraError] = useState<string>('');

  // Exercise session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (exerciseData: ExerciseData) => {
      return await apiRequest('POST', '/api/exercise-sessions', exerciseData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exercise-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      toast({
        title: "Exercise Completed!",
        description: "Your session has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save exercise session. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (exerciseState === 'active' && exerciseStartTime) {
      interval = setInterval(() => {
        setExerciseTimer(Math.floor((Date.now() - exerciseStartTime) / 1000));
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [exerciseState, exerciseStartTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const initCamera = async () => {
    setCameraState('loading');
    setCameraError('');

    try {
      const constraints = getCameraConstraints();
      const stream = await initializeCamera(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for video to load
        await new Promise<void>((resolve, reject) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => resolve();
            videoRef.current.onerror = () => reject(new Error('Video load failed'));
            setTimeout(() => reject(new Error('Video load timeout')), 5000);
          }
        });
        
        setCameraState('active');
      }
    } catch (error: any) {
      console.error('Camera initialization failed:', error);
      setCameraError(error.message);
      setCameraState('error');
    }
  };

  const retryCamera = async () => {
    cleanup();
    await initCamera();
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setExerciseState('idle');
    setExerciseStartTime(null);
    setExerciseTimer(0);
  };

  const startExercise = () => {
    if (cameraState !== 'active') {
      toast({
        title: "Camera Required",
        description: "Please enable your camera first to start exercising.",
        variant: "destructive",
      });
      return;
    }
    
    setExerciseState('active');
    setExerciseStartTime(Date.now());
    setRepCount(0);
    
    toast({
      title: "Exercise Started!",
      description: `Starting ${currentExercise} session. Follow the real-time guidance.`,
    });
  };

  const pauseExercise = () => {
    setExerciseState('paused');
    toast({
      title: "Exercise Paused",
      description: "Take a break. Resume when you're ready.",
    });
  };

  const stopExercise = () => {
    if (exerciseState === 'idle') return;
    
    // Save exercise session
    const exerciseData: ExerciseData = {
      exerciseType: currentExercise,
      duration: exerciseTimer,
      reps: repCount,
      accuracy: Math.round(Math.random() * 20 + 80), // Simulated accuracy
      postureScore: postureScore,
      notes: `Completed with ${repCount} reps in ${Math.round(exerciseTimer / 60)} minutes`
    };
    
    createSessionMutation.mutate(exerciseData);
    
    setExerciseState('idle');
    setExerciseStartTime(null);
    setExerciseTimer(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCameraStateDisplay = () => {
    switch (cameraState) {
      case 'permission':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 bg-gray-900">
            <Camera className="w-12 h-12 mb-4 text-mom-pink" />
            <h3 className="text-lg font-semibold mb-2">Camera Access Required</h3>
            <p className="text-gray-300 text-center mb-4">
              Enable camera access to start your posture analysis
            </p>
            <Button 
              onClick={initCamera}
              className="bg-mom-pink hover:bg-mom-pink-accent text-white"
            >
              Enable Camera
            </Button>
          </div>
        );
      
      case 'loading':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 bg-gray-900">
            <RefreshCw className="w-12 h-12 mb-4 text-mom-pink animate-spin" />
            <h3 className="text-lg font-semibold mb-2">Initializing Camera</h3>
            <p className="text-gray-300 text-center">Please wait while we set up your camera...</p>
          </div>
        );
      
      case 'error':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 bg-gray-900">
            <AlertTriangle className="w-12 h-12 mb-4 text-yellow-400" />
            <h3 className="text-lg font-semibold mb-2">Camera Unavailable</h3>
            <p className="text-gray-300 text-center mb-4">
              {cameraError || "Please check your camera permissions or try refreshing the page"}
            </p>
            <Button 
              onClick={retryCamera}
              className="bg-mom-pink hover:bg-mom-pink-accent text-white"
            >
              Retry Camera
            </Button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Card className="border-mom-pink-light mb-8 camera-exercise-section">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl text-gray-900 mb-2">
              Real-Time Posture Analysis
            </CardTitle>
            <p className="text-mom-gray">
              Use our computer vision technology to perfect your exercise form
            </p>
          </div>
          <Badge className="bg-mom-pink-light text-mom-pink">
            AI-Powered
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Camera Feed */}
          <div className="space-y-4">
            <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video camera-container">
              <video
                ref={videoRef}
                className={`w-full h-full object-cover ${cameraState === 'active' ? 'block' : 'hidden'}`}
                autoPlay
                muted
                playsInline
              />
              
              {/* Pose Detection Overlay */}
              {cameraState === 'active' && videoRef.current && (
                <PoseDetection
                  videoRef={videoRef}
                  canvasRef={canvasRef}
                  isActive={exerciseState === 'active'}
                  onPostureUpdate={setPostureScore}
                  onRepCount={setRepCount}
                />
              )}
              
              <canvas
                ref={canvasRef}
                className={`absolute inset-0 w-full h-full pose-overlay ${
                  cameraState === 'active' ? 'block' : 'hidden'
                }`}
              />
              
              {/* Camera State Overlays */}
              {getCameraStateDisplay()}
              
              {/* Real-time Feedback */}
              {cameraState === 'active' && exerciseState === 'active' && (
                <div className="absolute top-4 left-4 bg-black bg-opacity-60 text-white px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Analyzing posture...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="flex items-center justify-between bg-mom-pink-light rounded-lg p-4">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={startExercise}
                  disabled={exerciseState === 'active' || cameraState !== 'active'}
                  className="bg-mom-pink text-white hover:bg-mom-pink-accent"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Exercise
                </Button>
                
                <Button
                  onClick={pauseExercise}
                  disabled={exerciseState !== 'active'}
                  variant="secondary"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
                
                <Button
                  onClick={stopExercise}
                  disabled={exerciseState === 'idle'}
                  variant="destructive"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              </div>
              
              <div className="text-sm text-mom-gray font-mono">
                {formatTime(exerciseTimer)}
              </div>
            </div>
          </div>

          {/* Exercise Guide & Feedback */}
          <div className="space-y-6">
            {/* Current Exercise */}
            <Card className="bg-mom-pink-light border-mom-pink-light">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Today's Exercise: {currentExercise}
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-mom-pink text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <span className="text-sm text-gray-700">Lie on your back with knees bent</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-mom-pink text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <span className="text-sm text-gray-700">Gently tilt pelvis forward</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-mom-pink text-white rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <span className="text-sm text-gray-700">Hold for 3-5 seconds</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Real-time Feedback Panel */}
            <Card className="border-mom-pink-light">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Real-time Feedback</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Posture Alignment</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            postureScore >= 80 ? 'bg-green-400' : 
                            postureScore >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${postureScore}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-medium ${
                        postureScore >= 80 ? 'text-green-600' : 
                        postureScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {postureScore}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-mom-gray">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 inline" />
                    <span>
                      {postureScore >= 80 ? 'Excellent posture detected' :
                       postureScore >= 60 ? 'Good alignment, minor adjustments needed' :
                       'Please adjust your posture'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Exercise Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-mom-pink-light">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-mom-pink">{repCount}</div>
                  <div className="text-sm text-mom-gray">Reps Today</div>
                </CardContent>
              </Card>
              
              <Card className="border-mom-pink-light">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{postureScore}%</div>
                  <div className="text-sm text-mom-gray">Accuracy</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
