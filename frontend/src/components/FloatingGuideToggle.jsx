import React, { useState, useEffect } from 'react';
import { BookOpen, X, CheckCircle2, Flame, Camera, Activity, Award } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function FloatingGuideToggle() {
  const { darkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const steps = [
    {
      num: '1',
      title: 'Camera & Positioning',
      desc: 'Stand 6–8 feet away from your webcam in good lighting. Ensure your full body (head to feet) is in frame.',
      icon: Camera,
    },
    {
      num: '2',
      title: 'Select Exercise',
      desc: 'Leave on Auto-detect for automatic movement classification, or select Squats, Push-ups, Plank, Jumping jacks, or Bicep curls.',
      icon: Activity,
    },
    {
      num: '3',
      title: 'Perform Reps with Form Tracking',
      desc: 'Live 33-point AI pose estimation measures joint angles. Reps count automatically when full range of motion is completed.',
      icon: CheckCircle2,
    },
    {
      num: '4',
      title: 'Finish & Predict Calories',
      desc: 'Click "Finish & predict calories" to calculate caloric burn with the ML model and automatically save it to your Profile history.',
      icon: Flame,
    },
  ];

  const exercises = [
    { name: 'Squats', target: 'Knees & Hips', tip: 'Keep heels grounded, lower hips until knees bend to 90° or deeper.' },
    { name: 'Push-ups', target: 'Elbows & Chest', tip: 'Keep body in straight plank, lower chest until elbows bend below 90°.' },
    { name: 'Plank', target: 'Core & Spine', tip: 'Hold head, shoulders, hips, and ankles in a straight horizontal line.' },
    { name: 'Jumping jacks', target: 'Cardio & Arms', tip: 'Extend arms fully overhead while jumping feet out past shoulder-width.' },
    { name: 'Bicep curls', target: 'Arms & Elbows', tip: 'Keep elbows tucked into sides, curl weights up with controlled tempo.' },
  ];

  return (
    <>
      {/* Sticky Floating Guide Button (Lower Left) */}
      <aside aria-label="System guide">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 left-6 z-50 w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md border ${
            darkMode
              ? 'bg-[#181824]/90 hover:bg-[#202030] text-[#ea580c] border-neutral-700/80 shadow-black/60 hover:border-orange-500/50 hover:shadow-orange-500/20'
              : 'bg-white/90 hover:bg-neutral-50 text-[#ea580c] border-neutral-200/90 shadow-neutral-900/15 hover:border-orange-500/50 hover:shadow-orange-500/20'
          }`}
          title="Workout Guide & Instructions"
          aria-label="Open workout guide"
        >
          <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-300 hover:rotate-6" />
        </button>
      </aside>

      {/* Guide Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            className={`relative w-full max-w-2xl rounded-[32px] border p-6 sm:p-8 shadow-2xl transition-all duration-200 max-h-[90vh] overflow-y-auto no-scrollbar ${
              darkMode
                ? 'bg-[#131316] border-[#26262c] text-[#f4f4f5]'
                : 'bg-white border-neutral-200 text-[#16161a]'
            }`}
          >
            {/* Close Button top-right */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 w-9 h-9 rounded-full border border-neutral-300 dark:border-neutral-700 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Close guide"
              aria-label="Close guide"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-600/30 shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#ea580c]">
                  System Instructions
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#16161a] dark:text-white">
                  How to Use the Workout Tracker
                </h2>
              </div>
            </div>

            {/* Quick Steps */}
            <div className="space-y-3 mb-6">
              {steps.map((st) => {
                const Icon = st.icon;
                return (
                  <div
                    key={st.num}
                    className={`p-4 rounded-2xl border flex items-start gap-3.5 transition-colors ${
                      darkMode ? 'bg-[#1a1a1f] border-[#26262c]' : 'bg-neutral-50/80 border-neutral-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-[#ea580c] font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
                      {st.num}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#16161a] dark:text-white">
                        {st.title}
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                        {st.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Exercise Form Tips */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
                Exercise Form Criteria
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {exercises.map((ex) => (
                  <div
                    key={ex.name}
                    className={`p-3 rounded-xl border ${
                      darkMode ? 'bg-[#181822] border-[#26262c]' : 'bg-neutral-50 border-neutral-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-[#ea580c]">{ex.name}</span>
                      <span className="text-[10px] text-neutral-400 font-medium">{ex.target}</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-normal">
                      {ex.tip}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full bg-[#ea580c] hover:bg-[#c2410c] text-white font-semibold text-sm rounded-2xl py-3.5 active:scale-[0.98] transition-all cursor-pointer shadow-md text-center"
            >
              Got it, let's work out!
            </button>
          </div>
        </div>
      )}
    </>
  );
}

