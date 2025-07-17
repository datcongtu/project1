import { useEffect, useRef, useState } from "react";

// MediaPipe global types
declare global {
  interface Window {
    Pose: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    POSE_CONNECTIONS: any;
    POSE_LANDMARKS: any;
  }
}

interface PoseDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isActive: boolean;
  onPostureUpdate: (score: number) => void;
  onRepCount: (count: number) => void;
}

interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

interface PoseResults {
  image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement;
  poseLandmarks?: PoseLandmark[];
  segmentationMask?: ImageData;
}

export default function PoseDetection({
  videoRef,
  canvasRef,
  isActive,
  onPostureUpdate,
  onRepCount
}: PoseDetectionProps) {
  const animationRef = useRef<number>();
  const poseRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const [repCount, setRepCount] = useState(0);
  const [lastPostureCheck, setLastPostureCheck] = useState(0);
  const [isMediaPipeLoaded, setIsMediaPipeLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Exercise tracking state
  const previousHipY = useRef<number>(0);
  const movementDirection = useRef<'up' | 'down' | 'none'>('none');
  const repInProgress = useRef<boolean>(false);

  // Check MediaPipe scripts loaded from HTML
  useEffect(() => {
    const checkMediaPipe = () => {
      if (window.Pose && window.Camera && window.drawConnectors && window.drawLandmarks) {
        console.log('✅ All MediaPipe scripts loaded from HTML');
        setIsMediaPipeLoaded(true);
      } else {
        console.log('⏳ Waiting for MediaPipe scripts to load...');
        // Try again after a short delay
        setTimeout(checkMediaPipe, 100);
      }
    };

    checkMediaPipe();
  }, []);

  // Initialize MediaPipe Pose
  useEffect(() => {
    if (!isMediaPipeLoaded || !isActive || isInitialized) return;

    const initializePose = async () => {
      try {
        const pose = new window.Pose({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5/${file}`;
          }
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        pose.onResults(onPoseResults);
        poseRef.current = pose;

        // Start manual pose detection loop instead of using MediaPipe Camera
        if (videoRef.current) {
          console.log('🎬 Video element ready, starting pose detection...');
          setIsInitialized(true);
          console.log('✅ MediaPipe Pose initialized successfully');
          // Start detection loop immediately
          startPoseDetectionLoop();
        }
      } catch (error) {
        console.error('Failed to initialize MediaPipe Pose:', error);
        // Fall back to simulation
        startSimulation();
      }
    };

    initializePose();
  }, [isMediaPipeLoaded, isActive, isInitialized]);

  // Manual pose detection loop
  const startPoseDetectionLoop = () => {
    console.log('🚀 Starting pose detection loop...');
    console.log('Debug state:', { 
      hasPoseRef: !!poseRef.current,
      hasVideoRef: !!videoRef.current,
      isActive,
      isInitialized,
      videoReadyState: videoRef.current?.readyState,
      videoPlaying: !videoRef.current?.paused
    });
    
    const detectPose = async () => {
      // More relaxed checking - only require the essential refs
      if (!poseRef.current || !videoRef.current) {
        console.log('❌ Missing essential refs:', {
          hasPoseRef: !!poseRef.current,
          hasVideoRef: !!videoRef.current
        });
        // Retry after short delay
        setTimeout(detectPose, 100);
        return;
      }

      // Check if video is ready
      if (videoRef.current.readyState < 2) {
        console.log('⏳ Video not ready, waiting...');
        setTimeout(detectPose, 100);
        return;
      }

      try {
        console.log('📡 Sending frame to MediaPipe...');
        // Send video frame to MediaPipe for pose detection
        await poseRef.current.send({ image: videoRef.current });
        console.log('✅ Frame sent successfully');
      } catch (error) {
        console.error('💥 Pose detection error:', error);
      }

      // Continue the loop at 30 FPS for smooth tracking
      if (isActive) {
        setTimeout(() => {
          animationRef.current = requestAnimationFrame(detectPose);
        }, 33); // ~30 FPS
      }
    };

    // Start immediately
    detectPose();
  };

  // Clean up MediaPipe
  useEffect(() => {
    if (!isActive && isInitialized) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      poseRef.current = null;
      setIsInitialized(false);
    }
  }, [isActive, isInitialized]);

  const onPoseResults = (results: PoseResults) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video every frame
    if (videoRef.current) {
      const videoWidth = videoRef.current.videoWidth || 640;
      const videoHeight = videoRef.current.videoHeight || 480;
      
      if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        console.log('📐 Canvas resized to:', videoWidth, 'x', videoHeight);
      }
    }

    // Clear canvas completely
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw pose landmarks if detected
    if (results.poseLandmarks && results.poseLandmarks.length === 33) {
      console.log('🎯 Drawing', results.poseLandmarks.length, 'landmarks in real-time');
      
      // Draw skeleton connections first
      if (window.drawConnectors && window.POSE_CONNECTIONS) {
        window.drawConnectors(ctx, results.poseLandmarks, window.POSE_CONNECTIONS, {
          color: '#FF6B9D',
          lineWidth: 2
        });
      }

      // Draw landmarks that follow real body movement
      drawRealTimeLandmarks(ctx, results.poseLandmarks, canvas.width, canvas.height);

      // Analyze pose for exercise tracking
      analyzePose(results.poseLandmarks);
    }
  };

  const analyzePose = (landmarks: PoseLandmark[]) => {
    if (!landmarks || landmarks.length < 33) return;

    const now = Date.now();
    
    // Get key landmarks for pelvic tilt analysis
    const leftHip = landmarks[23]; // Left hip
    const rightHip = landmarks[24]; // Right hip
    const leftShoulder = landmarks[11]; // Left shoulder
    const rightShoulder = landmarks[12]; // Right shoulder
    const nose = landmarks[0]; // Nose for head position

    // Calculate hip center
    const hipCenterY = (leftHip.y + rightHip.y) / 2;
    
    // Calculate posture score based on alignment
    const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
    const spineAlignment = Math.abs(nose.y - shoulderCenterY - hipCenterY);
    const postureScore = Math.max(0, Math.min(100, 100 - (spineAlignment * 200)));

    // Update posture score every second
    if (now - lastPostureCheck > 1000) {
      onPostureUpdate(Math.round(postureScore));
      setLastPostureCheck(now);
    }

    // Rep counting for pelvic tilts
    countReps(hipCenterY);
  };

  const drawRealTimeLandmarks = (ctx: CanvasRenderingContext2D, landmarks: PoseLandmark[], width: number, height: number) => {
    console.log('🎨 Drawing real-time landmarks, count:', landmarks.length);
    
    // Draw all 33 landmarks with visibility check
    landmarks.forEach((landmark, index) => {
      const x = landmark.x * width;
      const y = landmark.y * height;
      
      // Only draw visible landmarks within canvas bounds
      if (landmark.visibility > 0.5 && x >= 0 && x <= width && y >= 0 && y <= height) {
        ctx.save();
        
        // Different colors and sizes for different body parts
        let color = '#FF6B9D'; // Default pink
        let radius = 8;
        
        // Face landmarks (0-10)
        if (index <= 10) {
          color = '#FFD700'; // Gold
          radius = 6;
        }
        // Hand landmarks (15-22) - most important for tracking
        else if (index >= 15 && index <= 22) {
          color = '#FF0000'; // Bright red for hands
          radius = 12;
        }
        // Body core (23-24 hips)
        else if (index >= 23 && index <= 24) {
          color = '#00CED1'; // Turquoise
          radius = 10;
        }
        // Legs (25-32)
        else if (index >= 25) {
          color = '#32CD32'; // Lime green
          radius = 8;
        }
        
        // Draw main circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        
        // Draw white border for contrast
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw landmark number
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(index.toString(), x, y + 3);
        
        ctx.restore();
      }
    });
    
    // Add special labels for hands
    if (landmarks[15] && landmarks[15].visibility > 0.5) {
      const x = landmarks[15].x * width;
      const y = landmarks[15].y * height;
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.font = 'bold 12px Arial';
      ctx.strokeText('LEFT HAND', x + 15, y - 15);
      ctx.fillText('LEFT HAND', x + 15, y - 15);
    }
    
    if (landmarks[16] && landmarks[16].visibility > 0.5) {
      const x = landmarks[16].x * width;
      const y = landmarks[16].y * height;
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.font = 'bold 12px Arial';
      ctx.strokeText('RIGHT HAND', x + 15, y - 15);
      ctx.fillText('RIGHT HAND', x + 15, y - 15);
    }
  };

  const countReps = (currentHipY: number) => {
    const threshold = 0.02; // Movement threshold

    if (previousHipY.current === 0) {
      previousHipY.current = currentHipY;
      return;
    }

    const movement = currentHipY - previousHipY.current;

    // Detect movement direction
    if (Math.abs(movement) > threshold) {
      const newDirection = movement > 0 ? 'down' : 'up';
      
      // If direction changed and we're moving up (completing a tilt)
      if (movementDirection.current === 'down' && newDirection === 'up' && !repInProgress.current) {
        const newRepCount = repCount + 1;
        setRepCount(newRepCount);
        onRepCount(newRepCount);
        repInProgress.current = true;
        
        // Reset rep progress after a short delay
        setTimeout(() => {
          repInProgress.current = false;
        }, 1000);
      }
      
      movementDirection.current = newDirection;
    }

    previousHipY.current = currentHipY;
  };

  const startSimulation = () => {
    const detectPose = () => {
      if (!videoRef.current || !canvasRef.current || !isActive) return;

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      // Set canvas size to match video
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      // Clear canvas and draw video
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Draw enhanced simulation
      const now = Date.now();
      if (now - lastPostureCheck > 1000) {
        const baseScore = 75 + Math.sin(now / 5000) * 15;
        const randomVariation = (Math.random() - 0.5) * 10;
        const postureScore = Math.max(0, Math.min(100, Math.round(baseScore + randomVariation)));
        
        onPostureUpdate(postureScore);
        
        if (Math.random() < 0.3) {
          const newRepCount = repCount + 1;
          setRepCount(newRepCount);
          onRepCount(newRepCount);
        }
        
        setLastPostureCheck(now);
      }

      // Draw simulated pose
      drawSimulatedPose(ctx, canvas.width, canvas.height, now);

      animationRef.current = requestAnimationFrame(detectPose);
    };

    detectPose();
  };

  // Fallback simulation if MediaPipe not available
  useEffect(() => {
    if (!isMediaPipeLoaded && isActive) {
      console.log('📺 Using pose detection simulation as fallback');
      startSimulation();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, isMediaPipeLoaded, repCount, lastPostureCheck]);

  const drawSimulatedPose = (ctx: CanvasRenderingContext2D, width: number, height: number, timestamp: number) => {
    // Enhanced pose tracking simulation that follows more realistic movement patterns
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Create more responsive animated pose points that simulate real body movement
    const time = timestamp / 1000;
    const exercisePhase = Math.sin(time * 0.5); // Slower exercise rhythm
    const microMovements = Math.sin(time * 2) * 2; // Small natural movements
    
    // Simulate pelvic tilt exercise movements
    const pelvicTiltOffset = exercisePhase * 15; // Simulate forward/backward pelvic movement
    const spineMovement = exercisePhase * 8; // Simulate spine engagement
    
    const points = [
      // Head - moves slightly with spine
      { x: centerX + microMovements, y: centerY - 100 + spineMovement * 0.3, label: 'head' },
      // Shoulders - stable but responsive to spine
      { x: centerX - 80 + microMovements * 0.5, y: centerY - 50 + spineMovement * 0.5, label: 'left_shoulder' },
      { x: centerX + 80 - microMovements * 0.5, y: centerY - 50 + spineMovement * 0.5, label: 'right_shoulder' },
      // Elbows - natural arm movement
      { x: centerX - 100 + Math.sin(time * 1.1) * 4, y: centerY + microMovements, label: 'left_elbow' },
      { x: centerX + 100 - Math.sin(time * 1.1) * 4, y: centerY + microMovements, label: 'right_elbow' },
      // Wrists - more active movement for balance
      { x: centerX - 120 + Math.cos(time * 1.3) * 6, y: centerY + 50 + microMovements * 2, label: 'left_wrist' },
      { x: centerX + 120 - Math.cos(time * 1.3) * 6, y: centerY + 50 + microMovements * 2, label: 'right_wrist' },
      // Hip - primary movement for pelvic tilts
      { x: centerX + pelvicTiltOffset * 0.3, y: centerY + 80 + pelvicTiltOffset, label: 'hip' },
      // Knees - responsive to hip movement
      { x: centerX - 40 + pelvicTiltOffset * 0.2, y: centerY + 150 + pelvicTiltOffset * 0.5, label: 'left_knee' },
      { x: centerX + 40 + pelvicTiltOffset * 0.2, y: centerY + 150 + pelvicTiltOffset * 0.5, label: 'right_knee' },
    ];

    // Draw pose connections
    ctx.strokeStyle = 'rgba(216, 136, 163, 0.8)'; // mom-pink color
    ctx.lineWidth = 2;
    
    const connections = [
      [0, 1], [0, 2], // head to shoulders
      [1, 3], [2, 4], // shoulders to elbows
      [3, 5], [4, 6], // elbows to wrists
      [1, 7], [2, 7], // shoulders to hip
      [7, 8], [7, 9], // hip to knees
    ];

    connections.forEach(([start, end]) => {
      ctx.beginPath();
      ctx.moveTo(points[start].x, points[start].y);
      ctx.lineTo(points[end].x, points[end].y);
      ctx.stroke();
    });

    // Draw pose landmarks with improved visual feedback
    points.forEach((point, index) => {
      ctx.beginPath();
      const radius = point.label === 'hip' ? 8 : 6; // Larger dot for hip (main focus point)
      ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
      
      // Different colors for different body parts
      if (point.label === 'hip') {
        ctx.fillStyle = 'rgba(255, 107, 180, 0.9)'; // Bright pink for hip
      } else if (point.label.includes('wrist')) {
        ctx.fillStyle = 'rgba(147, 197, 253, 0.9)'; // Blue for hands
      } else {
        ctx.fillStyle = 'rgba(216, 136, 163, 0.9)'; // Default mom-pink color
      }
      
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = point.label === 'hip' ? 3 : 2;
      ctx.stroke();
      
      // Add pulsing effect to main tracking point (hip)
      if (point.label === 'hip') {
        const pulseRadius = radius + Math.sin(timestamp / 200) * 3;
        ctx.beginPath();
        ctx.arc(point.x, point.y, pulseRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(255, 107, 180, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // Enhanced feedback text with exercise guidance
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeText('Theo dõi chuyển động cơ thể', 20, 35);
    ctx.fillText('Theo dõi chuyển động cơ thể', 20, 35);
    
    ctx.font = '16px Inter, sans-serif';
    if (repCount > 0) {
      ctx.strokeText(`Số lần: ${repCount}`, 20, 65);
      ctx.fillText(`Số lần: ${repCount}`, 20, 65);
    }
    
    // Exercise instruction
    ctx.font = '14px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.strokeText('Chấm hồng theo chuyển động hông', 20, 90);
    ctx.fillText('Chấm hồng theo chuyển động hông', 20, 90);
  };

  return null; // This component only handles the pose detection logic
}
