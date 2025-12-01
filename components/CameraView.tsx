import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, Upload, X, RefreshCw, AlertTriangle, Image as ImageIcon } from 'lucide-react';

interface CameraViewProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      let errorMessage = "Unable to access camera.";
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = "Camera permission was denied. Please allow access in your browser settings or upload a photo.";
      } else if (err.name === 'NotFoundError') {
        errorMessage = "No camera found on this device.";
      } else if (err.name === 'NotReadableError') {
        errorMessage = "Camera is in use by another app.";
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = () => {
    if (videoRef.current && !error) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const base64 = dataUrl.split(',')[1];
        onCapture(base64);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        onCapture(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="relative z-10 p-4 flex justify-between items-center text-white bg-gradient-to-b from-black/60 to-transparent">
        <button 
          onClick={onCancel} 
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <span className="font-semibold tracking-wide">Snap Food</span>
        <div className="w-10"></div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-gray-900">
        {!error ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="w-8 h-8 border-4 border-t-green-500 border-white/20 rounded-full animate-spin"></div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto animate-fade-in">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-10 h-10 text-yellow-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Camera Unavailable</h3>
            <p className="text-gray-400 mb-8">{error}</p>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-white text-black py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-transform active:scale-95"
            >
              <ImageIcon className="w-5 h-5" />
              Upload Photo Instead
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      {!error && (
        <div className="bg-gradient-to-t from-black/90 via-black/50 to-transparent pb-10 pt-20 px-6">
          <div className="flex justify-between items-center max-w-sm mx-auto">
            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="group flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <div className="p-3 bg-white/10 group-hover:bg-white/20 rounded-full backdrop-blur-md transition-colors">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium">Upload</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileUpload}
            />

            {/* Shutter Button */}
            <button
              onClick={handleCapture}
              className="w-20 h-20 border-[5px] border-white/30 rounded-full p-1 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <div className="w-full h-full bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)]"></div>
            </button>

            {/* Retry Camera */}
            <button
              onClick={startCamera}
              className="group flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <div className="p-3 bg-white/10 group-hover:bg-white/20 rounded-full backdrop-blur-md transition-colors">
                <RefreshCw className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium">Retry</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraView;