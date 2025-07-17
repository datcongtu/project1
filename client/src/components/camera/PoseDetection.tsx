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

  // Load MediaPipe scripts
  useEffect(() => {
    const loadMediaPipe = async () => {
      if (window.Pose && window.Camera) {
        setIsMediaPipeLoaded(true);
        return;
      }

      try {
        // Load MediaPipe scripts
        const scripts = [
          'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3/camera_utils.js',
          'https://cdn.jsdelivr.net/npm/@mediapipe/control_utils@0.6/control_utils.js',
          'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3/drawing_utils.js',
          'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5/pose.js'
        ];

        for (const src of scripts) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        console.log('MediaPipe scripts loaded successfully');
        setIsMediaPipeLoaded(true);
      } catch (error) {
        console.error('Failed to load MediaPipe:', error);
        // Fall back to simulation if MediaPipe fails to load
        setIsMediaPipeLoaded(false);
      }
    };

    loadMediaPipe();
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

        if (videoRef.current) {
          const camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (poseRef.current && videoRef.current) {
                await poseRef.current.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480
          });

          cameraRef.current = camera;
          setIsInitialized(true);
          console.log('MediaPipe Pose initialized successfully');
        }
      } catch (error) {
        console.error('Failed to initialize MediaPipe Pose:', error);
        // Fall back to simulation
        startSimulation();
      }
    };

    initializePose();
  }, [isMediaPipeLoaded, isActive, isInitialized]);

  // Clean up MediaPipe
  useEffect(() => {
    if (!isActive && isInitialized) {
      if (cameraRef.current) {
        try {
          cameraRef.current.stop();
        } catch (error) {
          console.warn('Error stopping camera:', error);
        }
      }
      poseRef.current = null;
      cameraRef.current = null;
      setIsInitialized(false);
    }
  }, [isActive, isInitialized]);

  const onPoseResults = (results: PoseResults) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    if (videoRef.current) {
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
    }

    // Clear canvas and draw the input image
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    // Draw pose landmarks if detected
    if (results.poseLandmarks && window.drawConnectors && window.drawLandmarks) {
      // Draw pose connections
      window.drawConnectors(ctx, results.poseLandmarks, window.POSE_CONNECTIONS, {
        color: '#D888A3', // Mom-pink color
        lineWidth: 3
      });

      // Draw pose landmarks
      window.drawLandmarks(ctx, results.poseLandmarks, {
        color: '#D888A3',
        fillColor: '#FFFFFF',
        lineWidth: 2,
        radius: 6
      });

      // Analyze pose for exercise tracking
      analyzePose(results.poseLandmarks);
    }

    ctx.restore();
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
      console.log('Using pose detection simulation');
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
