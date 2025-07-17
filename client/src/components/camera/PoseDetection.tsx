import { useEffect, useRef, useState } from "react";

interface PoseDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isActive: boolean;
  onPostureUpdate: (score: number) => void;
  onRepCount: (count: number) => void;
}

export default function PoseDetection({
  videoRef,
  canvasRef,
  isActive,
  onPostureUpdate,
  onRepCount
}: PoseDetectionProps) {
  const animationRef = useRef<number>();
  const [repCount, setRepCount] = useState(0);
  const [lastPostureCheck, setLastPostureCheck] = useState(0);

  useEffect(() => {
    if (!isActive) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    // TODO: Replace with actual MediaPipe implementation
    // This is a simulation of pose detection functionality
    const detectPose = () => {
      if (!videoRef.current || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Simulate pose detection with random values that change over time
      const now = Date.now();
      if (now - lastPostureCheck > 1000) { // Update every second
        // Simulate varying posture scores
        const baseScore = 75 + Math.sin(now / 5000) * 15; // Oscillates between 60-90
        const randomVariation = (Math.random() - 0.5) * 10;
        const postureScore = Math.max(0, Math.min(100, Math.round(baseScore + randomVariation)));
        
        onPostureUpdate(postureScore);
        
        // Simulate rep counting (increment every 3-5 seconds during exercise)
        if (Math.random() < 0.3) { // 30% chance each second to count a rep
          const newRepCount = repCount + 1;
          setRepCount(newRepCount);
          onRepCount(newRepCount);
        }
        
        setLastPostureCheck(now);
      }

      // Draw simulated pose landmarks
      drawSimulatedPose(ctx, canvas.width, canvas.height, now);

      // Continue animation loop
      animationRef.current = requestAnimationFrame(detectPose);
    };

    detectPose();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, videoRef, canvasRef, onPostureUpdate, onRepCount, repCount, lastPostureCheck]);

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
