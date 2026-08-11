'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CreatureDisplay } from '@/components/CreatureDisplay';
import { type CreatureState, type AnimationType } from '@/lib/creatures';
import { Heart, Sparkles, Trophy, Flame, Gift, X } from 'lucide-react';

interface VirtualPetWidgetProps {
  isAuthenticated?: boolean;
  onOpenAuthModal?: () => void;
}

const PET_OPTIONS = [
  { id: 'boom', name: 'Boom', title: 'Goblin Knight ⚔️' },
  { id: 'zing', name: 'Zing', title: 'Lightning ⚡' },
  { id: 'guardian', name: 'Guardian', title: 'Sentinel 🛡️' },
  { id: 'echo', name: 'Echo', title: 'Sonic Ranger 🎧' },
  { id: 'glimmer', name: 'Glimmer', title: 'The Guide 🌟' },
  { id: 'sparkle', name: 'Sparkle', title: 'The Spark 🎉' },
  { id: 'pixel', name: 'Pixel', title: 'Guardian 📘' },
  { id: 'drift', name: 'Drift', title: 'Dreamer ☁️' }
];

const SPEECH_MESSAGES = [
  "Yay! Family time! 💖",
  "Did someone post photos? 📸",
  "I'm feeling happy! ✨",
  "Keep the streak going! 🔥",
  "Tap me for a dance! 💃"
];

export const VirtualPetWidget: React.FC<VirtualPetWidgetProps> = ({
  isAuthenticated = false,
  onOpenAuthModal
}) => {
  const [selectedPet, setSelectedPet] = useState<string>('boom');
  const [petState, setPetState] = useState<CreatureState>('happy');
  const [petAnimation, setPetAnimation] = useState<AnimationType>('bounce');
  const [happiness, setHappiness] = useState<number>(85);
  const [level, setLevel] = useState<number>(2);
  const [streak, setStreak] = useState<number>(3);
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedPet = localStorage.getItem('isla_family_pet');
      const savedHappiness = localStorage.getItem('isla_pet_happiness');
      const savedLevel = localStorage.getItem('isla_pet_level');
      if (savedPet) setSelectedPet(savedPet);
      if (savedHappiness) setHappiness(Math.min(100, parseInt(savedHappiness, 10)));
      if (savedLevel) setLevel(parseInt(savedLevel, 10));
    } catch {
      // Fallback
    }
  }, []);

  const triggerHaptic = useCallback(() => {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try { navigator.vibrate(25); } catch {}
    }
  }, []);

  const handleTapPet = () => {
    triggerHaptic();
    const states: CreatureState[] = ['excited', 'dancing', 'winking', 'celebrating'];
    const animations: AnimationType[] = ['bounce', 'wiggle', 'spin', 'dance'];
    
    const randomState = states[Math.floor(Math.random() * states.length)];
    const randomAnim = animations[Math.floor(Math.random() * animations.length)];
    const randomMessage = SPEECH_MESSAGES[Math.floor(Math.random() * SPEECH_MESSAGES.length)];

    setPetState(randomState);
    setPetAnimation(randomAnim);
    setSpeechBubble(randomMessage);

    setHappiness(prev => {
      const next = Math.min(100, prev + 5);
      try { localStorage.setItem('isla_pet_happiness', next.toString()); } catch {}
      return next;
    });

    setTimeout(() => {
      setPetState('happy');
      setPetAnimation('gentle_bounce');
      setSpeechBubble(null);
    }, 2500);
  };

  const handleGiveTreat = () => {
    triggerHaptic();
    setPetState('celebrating');
    setPetAnimation('celebrate');
    setSpeechBubble("YUMMY! 🍎✨");
    setHappiness(100);
    try { localStorage.setItem('isla_pet_happiness', '100'); } catch {}

    setTimeout(() => {
      setPetState('happy');
      setPetAnimation('gentle_bounce');
      setSpeechBubble(null);
    }, 2000);
  };

  const handleChangePet = (petId: string) => {
    setSelectedPet(petId);
    try { localStorage.setItem('isla_family_pet', petId); } catch {}
    handleTapPet();
  };

  const currentPetObj = PET_OPTIONS.find(p => p.id === selectedPet) || PET_OPTIONS[0];

  return (
    <div className="w-full max-w-xl mx-auto my-3 px-2">
      {/* High-Contrast Standout Card Container */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-50 via-purple-50 to-pink-50 dark:from-slate-800 dark:via-purple-950 dark:to-slate-800 border-2 border-purple-400/50 shadow-xl p-3.5 text-slate-900 dark:text-slate-100 flex items-center justify-between gap-3">
        
        {/* Left: Creature Mascot in High-Contrast Glowing Light Circle */}
        <div 
          onClick={handleTapPet}
          className="flex items-center space-x-3 cursor-pointer group min-w-0"
        >
          <div className="relative p-2 rounded-full bg-white dark:bg-slate-900 border-2 border-purple-400 shadow-md flex-shrink-0 group-hover:scale-105 transition-transform">
            <CreatureDisplay 
              creatureId={selectedPet}
              state={petState}
              animation={petAnimation}
              size="small"
            />
            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow">
              Lv.{level}
            </span>
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
                {currentPetObj.name}
              </span>
              <span className="inline-flex items-center text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-full">
                <Flame className="w-3 h-3 mr-0.5 fill-amber-500 text-amber-500" />
                {streak}d streak
              </span>
            </div>
            <span className="text-xs text-purple-700 dark:text-purple-300 italic font-medium truncate">
              {speechBubble || currentPetObj.title}
            </span>
          </div>
        </div>

        {/* Right: Happiness Progress & Switch Pet Button */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <div className="flex flex-col items-end">
            <div className="flex items-center space-x-1 text-xs font-bold text-pink-600 dark:text-pink-400">
              <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500 animate-pulse" />
              <span>{happiness}%</span>
            </div>
            <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
              <div 
                className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-500"
                style={{ width: `${happiness}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow active:scale-95 transition-all flex items-center space-x-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pet Menu</span>
          </button>
        </div>
      </div>

      {/* Pet Sanctuary Selector Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-slate-900 rounded-3xl p-5 border border-purple-500/40 shadow-2xl space-y-4 text-center">
            
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Pet Feature Display in High-Contrast Circle */}
            <div className="flex flex-col items-center pt-2">
              <div className="p-3.5 rounded-full bg-white dark:bg-slate-800 border-2 border-purple-400 shadow-xl">
                <CreatureDisplay creatureId={selectedPet} state={petState} animation={petAnimation} size="medium" />
              </div>
              <h3 className="text-base font-extrabold text-slate-100 mt-2">
                {currentPetObj.name} <span className="text-xs text-purple-400 font-normal">({currentPetObj.title})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Level {level} Family Companion</p>
            </div>

            {/* Pet Selector Grid */}
            <div>
              <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-2">
                Select Family Mascot
              </label>
              <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
                {PET_OPTIONS.map(pet => (
                  <button
                    key={pet.id}
                    onClick={() => handleChangePet(pet.id)}
                    className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all ${
                      selectedPet === pet.id
                        ? 'border-purple-500 bg-purple-500/20 ring-2 ring-purple-400'
                        : 'border-white/10 bg-slate-800/40 hover:bg-slate-800'
                    }`}
                  >
                    <div className="p-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
                      <CreatureDisplay creatureId={pet.id} state="happy" size="small" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-200 mt-1 truncate w-full">
                      {pet.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleGiveTreat}
                className="flex-1 py-2.5 px-3 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl shadow active:scale-95 transition-all flex items-center justify-center space-x-1"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Give Snack 🍎</span>
              </button>

              <button
                onClick={handleTapPet}
                className="flex-1 py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow active:scale-95 transition-all flex items-center justify-center space-x-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Play Dance 🎵</span>
              </button>
            </div>

            {/* Guest Nudge */}
            {!isAuthenticated && (
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-left">
                <span className="text-xs text-amber-200">
                  Save <strong>{currentPetObj.name}</strong> to your account!
                </span>
                <button
                  onClick={() => { setIsModalOpen(false); onOpenAuthModal?.(); }}
                  className="px-2.5 py-1 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-amber-400 flex-shrink-0"
                >
                  Sign Up
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
