'use client';

import React, { useState } from 'react';
import { X, Share2, Copy, Check, QrCode, Smartphone, Users } from 'lucide-react';
import { CreatureDisplay } from '@/components/CreatureDisplay';

interface FamilyQRInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteCode?: string;
  familyName?: string;
}

export const FamilyQRInviteModal: React.FC<FamilyQRInviteModalProps> = ({
  isOpen,
  onClose,
  inviteCode = 'FAMILY-ISLA-2026',
  familyName = 'Our Family Circle'
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const inviteUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/auth/signup?invite=${inviteCode}`
    : `https://isla-site.vercel.app/auth/signup?invite=${inviteCode}`;

  const handleShareLink = async () => {
    if (typeof window !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Join ${familyName} on Isla!`,
          text: `Hey! Click this magic pass link to join our family wall on Isla:`,
          url: inviteUrl
        });
      } catch (err) {
        // User cancelled share dialog
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-purple-200 dark:border-purple-800 text-center space-y-4">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Creature Header */}
        <div className="flex flex-col items-center justify-center pt-2">
          <CreatureDisplay creatureId="glimmer" state="excited" animation="bounce" size="medium" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-2">
            Invite Your Family! 💖
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
            Scan with any phone camera or share a 1-tap pass link via SMS or WhatsApp!
          </p>
        </div>

        {/* QR Code Container */}
        <div className="mx-auto w-44 h-44 bg-white p-3 rounded-2xl shadow-inner border border-slate-200 flex flex-col items-center justify-center relative group">
          {/* Simple QR pattern preview visual */}
          <div className="relative w-full h-full bg-slate-900 rounded-xl flex items-center justify-center p-2 text-white">
            <QrCode className="w-28 h-28 text-purple-400 animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/30 to-pink-500/30 rounded-xl pointer-events-none" />
          </div>
          <span className="text-[10px] font-mono text-purple-700 font-bold mt-1.5">
            CODE: {inviteCode}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handleShareLink}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl font-bold text-sm shadow-md active:scale-98 transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Magic Invite Link</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-semibold text-xs transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Link to Clipboard!' : 'Copy Link'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
