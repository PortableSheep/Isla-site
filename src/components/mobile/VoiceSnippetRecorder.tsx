'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Send, Volume2 } from 'lucide-react';

interface VoiceSnippetRecorderProps {
  onAudioRecorded?: (audioBlob: Blob, audioUrl: string) => void;
  onCancel?: () => void;
  maxDurationSeconds?: number;
}

export const VoiceSnippetRecorder: React.FC<VoiceSnippetRecorderProps> = ({
  onAudioRecorded,
  onCancel,
  maxDurationSeconds = 15
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Clean up timer and audio URL on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // Start Voice Recording
  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);

        // Stop all audio tracks to release microphone hardware access
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      // Start duration timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= maxDurationSeconds - 1) {
            stopRecording();
            return maxDurationSeconds;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error('Microphone access error:', err);
      setHasPermission(false);
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setIsRecording(false);
  };

  // Toggle Playback
  const togglePlay = () => {
    if (!audioPlayerRef.current || !audioUrl) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  // Delete Recording
  const handleDiscard = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingSeconds(0);
    if (onCancel) onCancel();
  };

  // Submit Voice Snippet
  const handleConfirm = () => {
    if (audioBlob && audioUrl && onAudioRecorded) {
      onAudioRecorded(audioBlob, audioUrl);
    }
  };

  return (
    <div className="w-full bg-purple-50 dark:bg-purple-950/40 p-3 rounded-2xl border border-purple-200 dark:border-purple-800 shadow-sm animate-in fade-in duration-200">
      {hasPermission === false && (
        <div className="text-xs text-red-500 font-medium text-center py-1">
          Microphone access denied. Please enable microphone permissions in your browser.
        </div>
      )}

      {/* Initial state: Tap to record */}
      {!isRecording && !audioUrl && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-purple-600 dark:text-purple-300" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Voice Note (max {maxDurationSeconds}s)
            </span>
          </div>
          <button
            onClick={startRecording}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow active:scale-95 transition-all"
          >
            <Mic className="w-4 h-4 animate-bounce" />
            <span>Record Voice</span>
          </button>
        </div>
      )}

      {/* Recording active state */}
      {isRecording && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400">
              00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds} / 00:{maxDurationSeconds}
            </span>
          </div>

          <button
            onClick={stopRecording}
            className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold shadow active:scale-95 transition-all"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
            <span>Stop</span>
          </button>
        </div>
      )}

      {/* Recorded preview state */}
      {audioUrl && !isRecording && (
        <div className="flex items-center justify-between space-x-2">
          <audio
            ref={audioPlayerRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
          <button
            onClick={togglePlay}
            className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 active:scale-95 transition-transform"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="h-2 bg-purple-200 dark:bg-purple-900 rounded-full overflow-hidden">
              <div className="h-full bg-purple-600 dark:bg-purple-400 w-full animate-pulse" />
            </div>
            <span className="text-[10px] text-purple-600 dark:text-purple-300 font-medium">
              Voice Note Ready ({recordingSeconds}s)
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={handleDiscard}
              className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
              title="Discard voice note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleConfirm}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center space-x-1"
            >
              <Send className="w-3 h-3" />
              <span>Attach</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
