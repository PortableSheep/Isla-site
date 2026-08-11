'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CreatureDisplay } from '@/components/CreatureDisplay';
import { type CreatureState, type AnimationType } from '@/lib/creatures';
import { Heart, Sparkles, Trophy, ChevronDown, ChevronUp, Flame, Gift, X } from 'lucide-react';

interface VirtualPetWidgetProps {
  isAuthenticated?: boolean;
  onOpenAuthModal?: () => void;
  onPostTrigger?: () => void;
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
  const [selectedPet, setSelectedPet] = useState<string>('glimmer');
  const [petState, setPetState] = useState<CreatureState>('happy');
  const [petAnimation, setPetAnimation] = useState<AnimationType>('bounce');
  const [happiness, setHappiness] = useState<number>(75);
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

  const currentPetObj = PET_OPTIONS.find(p => p.id === selectedPet) || PET_OPTIONS[4];

  return (
    <div className="w-full flex items-center justify-center py-1">
      {/* Sleek, Dark Glassmorphic Compact Pet Pill */}
      <div 
        onClick={handleTapPet}
        className="relative flex items-center space-x-2.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-white/10 backdrop-blur-md shadow-lg cursor-pointer hover:border-fuchsia-400/40 active:scale-98 transition-all"
      >
        {/* Animated Creature Avatar */}
        <div className="relative flex-shrink-0">
          <CreatureDisplay 
            creatureId={selectedPet}
            state={petState}
            animation={petAnimation}
            size="small"
          />
          <span className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow">
            Lv.{level}
          </span>
        </div>

        {/* Pet Name & Speech / Streak */}
        <div className="flex flex-col min-w-0 pr-1">
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-xs text-slate-100 truncate">
              {currentPetObj.name}
            </span>
            <span className="inline-flex items-center text-[10px] font-medium text-amber-400">
              <Flame className="w-2.5 h-2.5 mr-0.5 fill-amber-400" />
              {streak}d
            </span>
          </div>

          <span className="text-[10px] text-fuchsia-300 truncate">
            {speechBubble || `${happiness}% happy`}
          </span>
        </div>

        {/* Happiness Mini Ring */}
        <div className="flex items-center space-x-1 border-l border-white/10 pl-2">
          <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400 animate-pulse" />
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
            className="p-1 text-slate-400 hover:text-white"
            title="Pet Sanctuary"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Pet Sanctuary Modal (Clean overlay when expanded) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-slate-900 rounded-3xl p-5 border border-purple-500/30 shadow-2xl space-y-4 text-center">
            
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Pet Feature Display */}
            <div className="flex flex-col items-center pt-2">
              <CreatureDisplay creatureId={selectedPet} state={petState} animation={petAnimation} size="medium" />
              <h3 className="text-base font-bold text-slate-100 mt-2">
                {currentPetObj.name} <span className="text-xs text-purple-400 font-normal">({currentPetObj.title})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Level {level} Family Companion</p>
            </div>

            {/* Happiness & Stats */}
            <div className="bg-slate-800/60 p-3 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Happiness</span>
                <span className="font-bold text-pink-400">{happiness}%</span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500" style={{ width: `${happiness}%` }} />
              </div>
            </div>

            {/* Pet Selector Cards */}
            <div>
              <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-2">
                Switch Mascot
              </label>
              <div className="grid grid-cols-4 gap-2">
                {PET_OPTIONS.map(pet => (
                  <button
                    key={pet.id}
                    onClick={() => handleChangePet(pet.id)}
                    className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all ${
                      selectedPet === pet.id
                        ? 'border-purple-500 bg-purple-500/20 ring-1 ring-purple-400'
                        : 'border-white/5 bg-slate-800/40 hover:bg-slate-800'
                    }`}
                  >
                    <CreatureDisplay creatureId={pet.id} state="happy" size="small" />
                    <span className="text-[10px] font-bold text-slate-200 mt-1 truncate w-full">
                      {pet.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
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
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
                <span className="text-xs text-amber-200 text-left">
                  Save <strong>{currentPetObj.name}</strong> to your account!
                </span>
                <button
                  onClick={() => { setIsModalOpen(false); onOpenAuthModal?.(); }}
                  className="px-2 py-1 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-amber-400"
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
