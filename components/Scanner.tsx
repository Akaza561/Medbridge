
import React, { useRef, useState, useCallback } from 'react';
import { ICONS } from '../constants';
import { analyzeMedicineImage } from '../services/geminiService';
import { MedicineData } from '../types';

interface ScannerProps {
  onScanComplete: (data: MedicineData) => void;
  onClose: () => void;
}

export const Scanner: React.FC<ScannerProps> = ({ onScanComplete, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const captureAndScan = async () => {
    if (!videoRef.current) return;
    setIsScanning(true);
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoRef.current, 0, 0);
    
    const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];
    
    try {
      const result = await analyzeMedicineImage(base64Image);
      onScanComplete({
        ...result,
        id: Math.random().toString(36).substr(2, 9),
        imageUrl: canvas.toDataURL('image/jpeg')
      });
      stopCamera();
    } catch (err) {
      setError("AI analysis failed. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      try {
        const result = await analyzeMedicineImage(base64);
        onScanComplete({
          ...result,
          id: Math.random().toString(36).substr(2, 9),
          imageUrl: event.target?.result as string
        });
      } catch (err) {
        setError("AI analysis failed.");
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(track => track.stop());
    setStream(null);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <button 
          onClick={() => { stopCamera(); onClose(); }}
          className="absolute top-6 right-6 z-10 p-2 bg-slate-950/50 hover:bg-slate-950 text-slate-400 hover:text-white rounded-full transition-all"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="grid md:grid-cols-2 gap-0">
          <div className="relative aspect-square md:aspect-auto bg-black flex items-center justify-center group">
            {!stream ? (
              <div className="flex flex-col items-center gap-4 text-center p-8">
                <div className="w-20 h-20 bg-cyan-600/10 rounded-full flex items-center justify-center mb-2">
                  <ICONS.Camera className="w-10 h-10 text-cyan-500" />
                </div>
                <h3 className="text-xl font-semibold">Ready to Scan</h3>
                <p className="text-slate-400 text-sm max-w-[250px]">
                  Position the medicine packaging clearly within the frame.
                </p>
                <div className="flex flex-col gap-3 w-full max-w-[200px] mt-4">
                  <button 
                    onClick={startCamera}
                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-semibold transition-all shadow-lg"
                  >
                    Start Camera
                  </button>
                  <label className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold transition-all cursor-pointer text-center">
                    Upload from Gallery
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </label>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute inset-0 border-[40px] border-slate-900/40 pointer-events-none">
                  <div className="w-full h-full border-2 border-cyan-500/50 rounded-lg relative overflow-hidden">
                    <div className="scan-line absolute inset-x-0" />
                  </div>
                </div>
                <button 
                  onClick={captureAndScan}
                  disabled={isScanning}
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full border-4 border-slate-900 shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                >
                  <div className="w-12 h-12 bg-white rounded-full border-2 border-slate-200" />
                </button>
              </div>
            )}
            
            {isScanning && (
              <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center backdrop-blur-sm">
                <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-cyan-400 font-medium animate-pulse">Analyzing Medicine with AI...</p>
              </div>
            )}
          </div>

          <div className="p-10 flex flex-col justify-center bg-slate-900/50">
            <h2 className="text-3xl font-bold mb-4">Guidelines</h2>
            <ul className="space-y-6 text-slate-300">
              <li className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex-shrink-0 flex items-center justify-center mt-1">
                  <ICONS.Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-white">Ensure Lighting</p>
                  <p className="text-sm">Bright, natural light works best for OCR detection.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex-shrink-0 flex items-center justify-center mt-1">
                  <ICONS.Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-white">Capture Expiry Date</p>
                  <p className="text-sm">Make sure the date and manufacturer stamp are visible.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-500 flex-shrink-0 flex items-center justify-center mt-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2"/></svg>
                </div>
                <div>
                  <p className="font-semibold text-white">No Open Blisters</p>
                  <p className="text-sm">We only accept factory-sealed medicines for safety.</p>
                </div>
              </li>
            </ul>
            {error && (
              <div className="mt-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
