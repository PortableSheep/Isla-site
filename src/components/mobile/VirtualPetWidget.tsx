'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CreatureDisplay } from '@/components/CreatureDisplay';
import { type CreatureState, type AnimationType } from '@/lib/creatures';
import { Heart, Sparkles, Trophy, ChevronDown, ChevronUp, Flame, Gift } from 'lucide-react';

interface VirtualPetWidgetProps {
  isAuthenticated?: boolean;
  onOpenAuthModal?: () => void;
  onPostTrigger?: () => void;
}

const PET_OPTIONS = [
  { id: 'boom', name: 'Boom', title: 'Goblin Knight ⚔️', color: 'from-red-500 to-amber-500' },
  { id: 'zing', name: 'Zing', title: 'Lightning Speedster ⚡', color: 'from-amber-400 to-red-500' },
  { id: 'guardian', name: 'Guardian', title: 'Shield Sentinel 🛡️', color: 'from-indigo-600 to-blue-500' },
  { id: 'echo', name: 'Echo', title: 'Sonic Ranger 🎧', color: 'from-violet-600 to-indigo-500' },
  { id: 'glimmer', name: 'Glimmer', title: 'The Guide 🌟', color: 'from-purple-500 to-pink-500' },
  { id: 'sparkle', name: 'Sparkle', title: 'The Spark 🎉', color: 'from-pink-500 to-amber-400' },
  { id: 'pixel', name: 'Pixel', title: 'The Guardian 📘', color: 'from-blue-500 to-indigo-500' },
  { id: 'drift', name: 'Drift', title: 'The Dreamer ☁️', color: 'from-teal-400 to-emerald-500' }
];

const SPEECH_MESSAGES = [
  "Yay! Family time is the best! 💖",
  "Did someone say new photos? 📸",
  "I'm feeling so happy today! ✨",
  "Keep the family streak going! 🔥",
  "Give me a tap for a dance! 💃",
  "Isla site is looking awesome today! 🌟"
];

export const VirtualPetWidget: React.FC<VirtualPetWidgetProps> = ({
  isAuthenticated = false,
  onOpenAuthModal,
  onPostTrigger
}) => {
  const [selectedPet, setSelectedPet] = useState<string>('glimmer');
  const [petState, setPetState] = useState<CreatureState>('happy');
  const [petAnimation, setPetAnimation] = useState<AnimationType>('bounce');
  const [happiness, setHappiness] = useState<number>(75);
  const [level, setLevel] = useState<number>(2);
  const [streak, setStreak] = useState<number>(3);
  const [speechBubble, setSpeechBubble] = useState<string | null>("Tap me to play!");
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isTreatAnimating, setIsTreatAnimating] = useState<boolean>(false);

  // Load saved state from localStorage
  useEffect(() => {
    try {
      const savedPet = localStorage.getItem('isla_family_pet');
      const savedHappiness = localStorage.getItem('isla_pet_happiness');
      const savedLevel = localStorage.getItem('isla_pet_level');
      if (savedPet) setSelectedPet(savedPet);
      if (savedHappiness) setHappiness(Math.min(100, parseInt(savedHappiness, 10)));
      if (savedLevel) setLevel(parseInt(savedLevel, 10));
    } catch {
      // Fallback to default
    }
  }, []);

  // Trigger haptic feedback if available
  const triggerHaptic = useCallback(() => {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate(30);
      } catch {
        // ignore
      }
    }
  }, []);

  // Handle tapping pet
  const handleTapPet = () => {
    triggerHaptic();
    const states: CreatureState[] = ['excited', 'dancing', 'winking', 'celebrating', 'surprised'];
    const animations: AnimationType[] = ['bounce', 'wiggle', 'spin', 'dance', 'celebrate'];
    
    const randomState = states[Math.floor(Math.random() * states.length)];
    const randomAnim = animations[Math.floor(Math.random() * animations.length)];
    const randomMessage = SPEECH_MESSAGES[Math.floor(Math.random() * SPEECH_MESSAGES.length)];

    setPetState(randomState);
    setPetAnimation(randomAnim);
    setSpeechBubble(randomMessage);

    // Boost happiness
    setHappiness(prev => {
      const next = Math.min(100, prev + 5);
      try { localStorage.setItem('isla_pet_happiness', next.toString()); } catch {}
      return next;
    });

    // Reset back to happy state after animation
    setTimeout(() => {
      setPetState('happy');
      setPetAnimation('gentle_bounce');
    }, 2500);
  };

  // Handle giving a treat
  const handleGiveTreat = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic();
    setIsTreatAnimating(true);
    setPetState('celebrating');
    setPetAnimation('celebrate');
    setSpeechBubble("YUMMY! Thank you! 🍎✨");

    setHappiness(100);
    try { localStorage.setItem('isla_pet_happiness', '100'); } catch {}

    setTimeout(() => {
      setIsTreatAnimating(false);
      setPetState('happy');
      setPetAnimation('gentle_bounce');
    }, 2000);
  };

  // Change pet character
  const handleChangePet = (petId: string) => {
    setSelectedPet(petId);
    try { localStorage.setItem('isla_family_pet', petId); } catch {}
    handleTapPet();
  };

  const currentPetObj = PET_OPTIONS.find(p => p.id === selectedPet) || PET_OPTIONS[0];

  return (
    <div className="w-full max-w-2xl mx-auto px-2 py-1 select-none">
      <div 
        className="relative overflow-hidden rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-purple-200/60 dark:border-purple-900/50 shadow-md transition-all duration-300"
      >
        {/* Top Summary Bar */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-purple-50/50 dark:hover:bg-purple-950/20 active:scale-[0.99] transition-transform"
        >
          {/* Left: Pet Avatar & Speech Bubble */}
          <div className="flex items-center space-x-2 min-w-0">
            <div 
              onClick={(e) => { e.stopPropagation(); handleTapPet(); }} 
              className="relative flex-shrink-0 cursor-pointer p-1 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
              title="Tap your family pet!"
            >
              <CreatureDisplay 
                creatureId={selectedPet}
                state={petState}
                animation={petAnimation}
                size="small"
              />
              {/* Level Badge */}
              <span className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
                Lv.{level}
              </span>
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                  {currentPetObj.name}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-medium bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 rounded-full">
                  <Flame className="w-2.5 h-2.5 mr-0.5 text-amber-500 fill-amber-500" />
                  {streak}d streak
                </span>
              </div>
              
              {/* Speech bubble or happiness indicator */}
              <p className="text-xs text-purple-600 dark:text-purple-300 truncate italic">
                {speechBubble || currentPetObj.title}
              </p>
            </div>
          </div>

          {/* Right: Happiness Bar & Expand Toggle */}
          <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
            {/* Happiness Bar */}
            <div className="flex flex-col items-end">
              <div className="flex items-center space-x-1 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                <Heart className="w-3 h-3 text-pink-500 fill-pink-500 animate-pulse" />
                <span>{happiness}%</span>
              </div>
              <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-amber-400 transition-all duration-500"
                  style={{ width: `${happiness}%` }}
                />
              </div>
            </div>

            {/* Expand arrow */}
            <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded Controls Drawer */}
        {isExpanded && (
          <div className="px-3 py-3 border-t border-purple-100 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Pet Selector Cards */}
            <div>
              <label className="text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                Choose Family Companion
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 mt-1.5 max-h-52 overflow-y-auto pr-1">
                {PET_OPTIONS.map(pet => (
                  <button
                    key={pet.id}
                    onClick={() => handleChangePet(pet.id)}
                    className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all ${
                      selectedPet === pet.id
                        ? 'border-purple-500 bg-white dark:bg-slate-800 shadow-sm ring-2 ring-purple-400/30'
                        : 'border-transparent bg-white/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    <CreatureDisplay creatureId={pet.id} state="happy" size="small" />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mt-1">
                      {pet.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                onClick={handleGiveTreat}
                disabled={isTreatAnimating}
                className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 bg-pink-500 hover:bg-pink-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Give Snack 🍎</span>
              </button>

              <button
                onClick={handleTapPet}
                className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Play Dance 🎵</span>
              </button>
            </div>

            {/* Guest Pet Adoption Conversion Banner */}
            {!isAuthenticated && (
              <div className="mt-2 p-2.5 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-pink-500/10 border border-amber-300/40 dark:border-amber-700/40 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span className="text-xs text-slate-700 dark:text-slate-200">
                    Save <strong>{currentPetObj.name}</strong> to your account!
                  </span>
                </div>
                <button
                  onClick={onOpenAuthModal}
                  className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-lg shadow hover:opacity-90 active:scale-95 transition-all flex-shrink-0"
                >
                  Sign Up (1-Tap)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
