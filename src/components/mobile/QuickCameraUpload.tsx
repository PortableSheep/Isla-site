'use client';

import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, X, Sparkles, Check } from 'lucide-react';
import { CreatureDisplay } from '@/components/CreatureDisplay';

interface QuickCameraUploadProps {
  onPhotoCaptured: (file: File, creatureSticker?: string) => void;
}

export const QuickCameraUpload: React.FC<QuickCameraUploadProps> = ({
  onPhotoCaptured
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedSticker, setSelectedSticker] = useState<string | null>('glimmer');
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const url = URL.createObjectURL(file);
    setSelectedImage(url);
    setIsPreviewOpen(true);
  };

  const handleConfirmUpload = () => {
    if (imageFile) {
      onPhotoCaptured(imageFile, selectedSticker || undefined);
    }
    handleClose();
  };

  const handleClose = () => {
    if (selectedImage) URL.revokeObjectURL(selectedImage);
    setSelectedImage(null);
    setImageFile(null);
    setIsPreviewOpen(false);
  };

  return (
    <>
      {/* Native Mobile Camera Input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => cameraInputRef.current?.click()}
        className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-full text-xs font-bold shadow active:scale-95 transition-all"
      >
        <Camera className="w-4 h-4" />
        <span>Snap Photo 📸</span>
      </button>

      {/* Preview Modal */}
      {isPreviewOpen && selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-purple-200 dark:border-purple-800 space-y-4">
            
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center space-x-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Add Creature Sticker</span>
              </span>
              <button onClick={handleClose} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo Preview Container */}
            <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-slate-900 shadow-inner flex items-center justify-center">
              <img src={selectedImage} alt="Captured" className="w-full h-full object-cover" />

              {/* Overlay Sticker */}
              {selectedSticker && (
                <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-slate-900/90 p-1.5 rounded-2xl shadow-lg border border-purple-300 animate-bounce">
                  <CreatureDisplay creatureId={selectedSticker} state="happy" size="small" />
                </div>
              )}
            </div>

            {/* Sticker Selector */}
            <div className="flex items-center justify-between gap-2">
              {['glimmer', 'sparkle', 'pixel', 'drift'].map((stickerId) => (
                <button
                  key={stickerId}
                  onClick={() => setSelectedSticker(stickerId === selectedSticker ? null : stickerId)}
                  className={`flex-1 p-1 rounded-xl border flex items-center justify-center transition-all ${
                    selectedSticker === stickerId
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/40 ring-2 ring-purple-400/30'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                  }`}
                >
                  <CreatureDisplay creatureId={stickerId} state="happy" size="small" />
                </button>
              ))}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleConfirmUpload}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-2xl shadow-md text-sm active:scale-98 transition-all flex items-center justify-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>Attach Photo to Post</span>
            </button>

          </div>
        </div>
      )}
    </>
  );
};
