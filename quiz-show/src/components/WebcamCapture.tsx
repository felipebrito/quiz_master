'use client';

import { useRef, useEffect, useState } from 'react';
import { Camera, X } from 'lucide-react';

interface WebcamCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

export default function WebcamCapture({ onCapture, onClose }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Erro ao acessar a câmera. Verifique as permissões.');
      console.error('Erro ao acessar câmera:', err);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(imageData);
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Capturar Foto</h3>
          <button
            onClick={stopCamera}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error ? (
          <div className="text-red-400 text-center py-8">
            {error}
          </div>
        ) : (
          <>
            <div className="relative mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-64 bg-gray-700 rounded-lg object-cover"
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={capturePhoto}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Camera className="h-4 w-4 mr-2" />
                Capturar
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
