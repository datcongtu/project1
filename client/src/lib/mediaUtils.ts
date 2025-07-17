export interface CameraConstraints {
  video: {
    width: { ideal: number; min?: number };
    height: { ideal: number; min?: number };
    facingMode: string;
    frameRate: { ideal: number; min?: number };
  };
  audio: boolean;
}

export const getCameraConstraints = (): CameraConstraints => {
  // Primary constraints for optimal quality
  return {
    video: {
      width: { ideal: 1280, min: 640 },
      height: { ideal: 720, min: 480 },
      facingMode: 'user',
      frameRate: { ideal: 30, min: 15 }
    },
    audio: false
  };
};

export const getFallbackConstraints = (): CameraConstraints => {
  // Fallback constraints for lower-end devices
  return {
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      facingMode: 'user',
      frameRate: { ideal: 15 }
    },
    audio: false
  };
};

export const getBasicConstraints = (): CameraConstraints => {
  // Most basic constraints for maximum compatibility
  return {
    video: {
      width: { ideal: 320 },
      height: { ideal: 240 },
      facingMode: 'user',
      frameRate: { ideal: 10 }
    },
    audio: false
  };
};

export const initializeCamera = async (constraints: CameraConstraints): Promise<MediaStream> => {
  // Check if getUserMedia is supported
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Camera access is not supported on this device or browser');
  }

  try {
    // Try primary constraints first
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (primaryError: any) {
    console.warn('Primary camera constraints failed:', primaryError);
    
    // Try fallback constraints
    try {
      const fallbackConstraints = getFallbackConstraints();
      return await navigator.mediaDevices.getUserMedia(fallbackConstraints);
    } catch (fallbackError: any) {
      console.warn('Fallback camera constraints failed:', fallbackError);
      
      // Try most basic constraints
      try {
        const basicConstraints = getBasicConstraints();
        return await navigator.mediaDevices.getUserMedia(basicConstraints);
      } catch (basicError: any) {
        console.error('All camera constraint attempts failed:', basicError);
        throw new Error(getCameraErrorMessage(basicError));
      }
    }
  }
};

export const getCameraErrorMessage = (error: any): string => {
  if (!error) return 'Unknown camera error occurred';
  
  const errorName = error.name || '';
  const errorMessage = error.message || '';
  
  // Handle specific error types
  switch (errorName) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Camera access was denied. Please enable camera permissions in your browser settings and try again.';
    
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No camera device found. Please connect a camera and try again.';
    
    case 'NotReadableError':
    case 'TrackStartError':
      return 'Camera is being used by another application. Please close other apps using the camera and try again.';
    
    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
      return 'Camera does not support the requested settings. Trying with basic settings...';
    
    case 'NotSupportedError':
      return 'Camera access is not supported on this device or browser.';
    
    case 'SecurityError':
      return 'Camera access blocked for security reasons. Please ensure you are using HTTPS.';
    
    case 'TypeError':
      if (errorMessage.includes('getUserMedia')) {
        return 'Camera access is not supported on this browser. Please try a modern browser like Chrome, Firefox, or Safari.';
      }
      break;
    
    case 'AbortError':
      return 'Camera initialization was cancelled. Please try again.';
  }
  
  // Check for common error message patterns
  if (errorMessage.includes('Permission denied')) {
    return 'Camera access was denied. Please enable camera permissions and try again.';
  }
  
  if (errorMessage.includes('not found') || errorMessage.includes('no device')) {
    return 'No camera device found. Please connect a camera and try again.';
  }
  
  if (errorMessage.includes('in use') || errorMessage.includes('busy')) {
    return 'Camera is being used by another application. Please close other apps and try again.';
  }
  
  if (errorMessage.includes('not supported')) {
    return 'Camera access is not supported on this device or browser.';
  }
  
  // Generic fallback message
  return `Camera error: ${errorMessage || 'Please check your camera settings and try again.'}`;
};

export const stopCameraStream = (stream: MediaStream | null): void => {
  if (stream) {
    stream.getTracks().forEach(track => {
      track.stop();
    });
  }
};

export const switchCamera = async (currentStream: MediaStream | null): Promise<MediaStream> => {
  // Stop current stream
  stopCameraStream(currentStream);
  
  // Try to get available devices
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    
    if (videoDevices.length < 2) {
      throw new Error('Only one camera available');
    }
    
    // Try environment camera first (back camera on mobile)
    const constraints = {
      ...getCameraConstraints(),
      video: {
        ...getCameraConstraints().video,
        facingMode: 'environment'
      }
    };
    
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch {
      // Fall back to user-facing camera
      return await initializeCamera(getCameraConstraints());
    }
  } catch (error) {
    // If enumerate devices fails, just try with default constraints
    return await initializeCamera(getCameraConstraints());
  }
};

export const checkCameraPermissions = async (): Promise<boolean> => {
  try {
    if (!navigator.permissions) {
      // Permissions API not available, assume we need to request
      return false;
    }
    
    const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
    return result.state === 'granted';
  } catch (error) {
    // Permissions query failed, assume we need to request
    return false;
  }
};

export const requestCameraPermissions = async (): Promise<boolean> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: false 
    });
    
    // Stop the stream immediately, we just wanted to request permission
    stopCameraStream(stream);
    return true;
  } catch (error) {
    console.error('Camera permission request failed:', error);
    return false;
  }
};

export const getOptimalConstraints = async (): Promise<CameraConstraints> => {
  try {
    // Get available devices to determine capabilities
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    
    if (videoDevices.length === 0) {
      throw new Error('No video input devices found');
    }
    
    // For now, return standard constraints
    // In a real implementation, you could test device capabilities
    return getCameraConstraints();
  } catch (error) {
    console.warn('Could not enumerate devices, using default constraints');
    return getCameraConstraints();
  }
};
