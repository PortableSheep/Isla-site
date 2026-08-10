'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Mic, Sparkles, MessageCircle, ChevronDown } from 'lucide-react';
import { CreatureDisplay } from '@/components/CreatureDisplay';
import { VoiceSnippetRecorder } from '@/components/mobile/VoiceSnippetRecorder';
import { CreatureStampBar } from '@/components/mobile/CreatureStampBar';

export type CommentItem = {
  id: string;
  author_name: string | null;
  content: string;
  created_at: string;
  is_mine?: boolean;
  verified?: boolean;
  replies?: CommentItem[];
  voiceUrl?: string;
  stamps?: string[];
};

interface MobileCommentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  postTitle?: string;
  postAuthor?: string;
  comments: CommentItem[];
  onAddComment: (content: string, replyToId?: string | null, voiceUrl?: string | null, stamps?: string[]) => void;
}

export const MobileCommentDrawer: React.FC<MobileCommentDrawerProps> = ({
  isOpen,
  onClose,
  postTitle = 'Post Conversation',
  postAuthor = 'Family Member',
  comments = [],
  onAddComment
}) => {
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<CommentItem | null>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState<boolean>(false);
  const [showCreatureStamps, setShowCreatureStamps] = useState<boolean>(false);
  const [selectedStamps, setSelectedStamps] = useState<string[]>([]);
  const [attachedVoiceUrl, setAttachedVoiceUrl] = useState<string | null>(null);
  const [viewportBottomOffset, setViewportBottomOffset] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Monitor window.visualViewport for mobile soft keyboards (iOS / Android Gboard)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleVisualViewportResize = () => {
      if (!window.visualViewport) return;
      const keyboardHeight = window.innerHeight - window.visualViewport.height;
      setViewportBottomOffset(Math.max(0, keyboardHeight));
    };

    window.visualViewport.addEventListener('resize', handleVisualViewportResize);
    window.visualViewport.addEventListener('scroll', handleVisualViewportResize);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportResize);
        window.visualViewport.removeEventListener('scroll', handleVisualViewportResize);
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleSelectStamp = (stampId: string) => {
    setSelectedStamps(prev => 
      prev.includes(stampId) ? prev.filter(s => s !== stampId) : [...prev, stampId]
    );
  };

  const handleAudioRecorded = (_blob: Blob, audioUrl: string) => {
    setAttachedVoiceUrl(audioUrl);
    setShowVoiceRecorder(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() && !attachedVoiceUrl && selectedStamps.length === 0) return;

    onAddComment(
      newCommentText.trim(),
      replyingTo?.id || null,
      attachedVoiceUrl,
      selectedStamps
    );

    setNewCommentText('');
    setReplyingTo(null);
    setAttachedVoiceUrl(null);
    setSelectedStamps([]);
    setShowVoiceRecorder(false);
    setShowCreatureStamps(false);

    // Scroll to bottom
    setTimeout(() => {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Tap backdrop to close */}
      <div className="flex-1 w-full" onClick={onClose} />

      {/* Slide-Up Sheet Container */}
      <div 
        className="w-full max-h-[85vh] bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden border-t border-purple-200 dark:border-purple-800 transition-all duration-200"
        style={{ paddingBottom: `${viewportBottomOffset}px` }}
      >
        {/* Top Drag Handle & Header */}
        <div className="flex flex-col items-center pt-2 pb-3 px-4 border-b border-slate-100 dark:border-slate-800 relative bg-purple-50/50 dark:bg-purple-950/20">
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full cursor-pointer hover:bg-slate-400" onClick={onClose} />
          
          <div className="w-full flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                Comments ({comments.length})
              </h3>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Comment List Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[220px]">
          {comments.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <CreatureDisplay creatureId="sparkle" state="curious" size="medium" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                No comments yet! Be the first family member to reply ✨
              </p>
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="space-y-2">
                {/* Parent Comment */}
                <div className="flex space-x-2.5 group">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
                    {(c.author_name || 'F')[0].toUpperCase()}
                  </div>

                  <div className="flex-1 bg-slate-100 dark:bg-slate-800/70 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                        {c.author_name || 'Family Member'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                      {c.content}
                    </p>

                    {/* Audio Voice Note Player */}
                    {c.voiceUrl && (
                      <div className="pt-1">
                        <audio controls src={c.voiceUrl} className="w-full h-8 max-w-xs" />
                      </div>
                    )}

                    {/* Creature Stamp Reactions */}
                    {c.stamps && c.stamps.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {c.stamps.map((stampId, idx) => (
                          <span key={idx} className="text-[10px] bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-full font-bold">
                            ✨ Reaction
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Reply Link */}
                    <button
                      onClick={() => setReplyingTo(c)}
                      className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline pt-1"
                    >
                      Reply
                    </button>
                  </div>
                </div>

                {/* Sub-replies (Nested Threading) */}
                {c.replies && c.replies.length > 0 && (
                  <div className="pl-6 space-y-2 border-l-2 border-purple-200 dark:border-purple-900 ml-4">
                    {c.replies.map((r) => (
                      <div key={r.id} className="flex space-x-2">
                        <div className="w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                          {(r.author_name || 'F')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 bg-purple-50/60 dark:bg-purple-950/40 p-2.5 rounded-xl text-xs text-slate-700 dark:text-slate-200">
                          <span className="font-bold block text-[11px] text-purple-700 dark:text-purple-300">
                            {r.author_name}
                          </span>
                          {r.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Replying indicator bar */}
        {replyingTo && (
          <div className="flex items-center justify-between px-4 py-1.5 bg-purple-100 dark:bg-purple-950 text-xs text-purple-700 dark:text-purple-300">
            <span>Replying to <strong>@{replyingTo.author_name}</strong></span>
            <button onClick={() => setReplyingTo(null)} className="text-purple-500 hover:text-purple-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Voice snippet inline recorder */}
        {showVoiceRecorder && (
          <div className="p-3 bg-purple-50 dark:bg-slate-800 border-t border-purple-200">
            <VoiceSnippetRecorder
              onAudioRecorded={handleAudioRecorded}
              onCancel={() => setShowVoiceRecorder(false)}
            />
          </div>
        )}

        {/* Creature Stamp Bar */}
        {showCreatureStamps && (
          <div className="p-2 bg-purple-50/80 dark:bg-slate-800/80 border-t border-purple-200">
            <CreatureStampBar
              onSelectStamp={handleSelectStamp}
              activeStamps={selectedStamps}
            />
          </div>
        )}

        {/* Attached Voice Note Indicator */}
        {attachedVoiceUrl && (
          <div className="flex items-center justify-between px-4 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-700 dark:text-emerald-300">
            <span>🎙️ Voice note attached!</span>
            <button onClick={() => setAttachedVoiceUrl(null)} className="text-emerald-600 font-bold text-xs">Remove</button>
          </div>
        )}

        {/* Bottom Composer Bar */}
        <form 
          onSubmit={handleSubmit}
          className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center space-x-2"
        >
          {/* Voice Note Trigger */}
          <button
            type="button"
            onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
            className={`p-2 rounded-full transition-colors ${
              showVoiceRecorder 
                ? 'bg-purple-600 text-white' 
                : 'text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Record Voice Note"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Creature Stamps Trigger */}
          <button
            type="button"
            onClick={() => setShowCreatureStamps(!showCreatureStamps)}
            className={`p-2 rounded-full transition-colors ${
              showCreatureStamps 
                ? 'bg-purple-600 text-white' 
                : 'text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Creature Reactions"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder={replyingTo ? `Reply to @${replyingTo.author_name}...` : "Leave a comment..."}
            className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs px-3.5 py-2.5 rounded-full border border-transparent focus:border-purple-500 focus:outline-none"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!newCommentText.trim() && !attachedVoiceUrl && selectedStamps.length === 0}
            className="p-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
