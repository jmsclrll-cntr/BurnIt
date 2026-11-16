import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BookOpen, X } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

/* ========================================================================= */
/* EXISTING DATA SOURCES                                                     */
/* ========================================================================= */
const STAGES = [
  {
    id: 1,
    num: '01',
    title: 'Pick an exercise or use Auto-detect',
    subtitle: 'Tap an exercise pill, or leave Auto-detect on.',
    desc: 'Auto-detect identifies your movement in real time, so you never need to touch the screen mid-set.',
    imageDark: '/guide/actual_step1_select_dark.png',
    imageLight: '/guide/actual_step1_select_light.png',
    keyPoints: [
      'The active pill turns orange.',
      'Auto-detect checks your posture every 2 seconds.',
      'Switch exercises any time without ending your session.',
    ],
  },
  {
    id: 2,
    num: '02',
    title: 'Stand in frame and calibrate joints',
    subtitle: 'Position 6–8 feet away so your full body (head to feet) is visible.',
    desc: 'Ambient lighting helps the 33-point MediaPipe pose estimation model lock onto your joints at 30+ FPS, illuminating green skeletal lines when calibrated.',
    imageDark: '/guide/actual_step2_camera_dark.png',
    imageLight: '/guide/actual_step2_camera_light.png',
    keyPoints: [
      'Maintain 6–8 feet distance in good ambient lighting.',
      'Ensure head, shoulders, hips, knees, and feet are fully in frame.',
      'Audio chimes confirm every verified repetition with full depth.',
    ],
  },
  {
    id: 3,
    num: '03',
    title: 'Finish workout and trigger calorie engine',
    subtitle: 'Tap Finish & predict calories when your final repetition is complete.',
    desc: 'When you finish your sets, click the orange Finish & predict calories button. This halts camera tracking to conserve power and transfers telemetry to the calorie prediction model.',
    imageDark: '/guide/actual_step3_finish_dark.png',
    imageLight: '/guide/actual_step3_finish_light.png',
    keyPoints: [
      'Located prominently on the right-hand controls card under Camera/Reset.',
      'Consolidates all completed sets and time-under-tension.',
      'Seamlessly transitions to the Workout Complete estimation modal.',
    ],
  },
  {
    id: 4,
    num: '04',
    title: 'Review calorie burn and session summary',
    subtitle: 'View your metabolic burn, duration, and heart rate integration.',
    desc: 'The Workout Complete modal displays your predicted caloric burn, total active duration, and average heart rate using clinically validated MET ratings and ML prediction.',
    imageDark: '/guide/actual_step4_summary_dark.png',
    imageLight: '/guide/actual_step4_summary_light.png',
    keyPoints: [
      'Features high-contrast stat for kcal burned.',
      'Supports on-the-fly BPM heart rate recalculation.',
      'Automatically logs reps, cadence, and form scores to your user profile.',
    ],
  },
];

const EXERCISES_GUIDE = [
  { id: 'squat', name: 'Squats' },
  { id: 'pushup', name: 'Push-ups' },
  { id: 'plank', name: 'Plank' },
  { id: 'jumpingjack', name: 'Jumping jacks' },
  { id: 'bicepcurl', name: 'Bicep curls' },
];

/* ========================================================================= */
/* ADAPTER: Maps existing data to presentation shape                         */
/* ========================================================================= */
const stages = STAGES.map((st) => ({
  title: st.title,
  doText: st.subtitle || st.title,
  detail: st.desc || '',
  imageDark: st.imageDark,
  imageLight: st.imageLight,
  tips: st.keyPoints && st.keyPoints.length > 0 ? st.keyPoints : ['Follow proper form', 'Keep your body in frame'],
}));

const exercises = EXERCISES_GUIDE.map((ex) => ex.name);
const appName = 'BURN IT';

/* ========================================================================= */
/* MAIN COMPONENT: FloatingGuideToggle                                       */
/* ========================================================================= */
export default function FloatingGuideToggle() {
  const { darkMode } = useTheme();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const isTrackerPage = location.pathname === '/tracker';
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Close on Escape & Arrow navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setDirection(1);
        setCurrentStep((prev) => (prev < stages.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setDirection(-1);
        setCurrentStep((prev) => Math.max(0, prev - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Support custom event to open guide from any navbar link or button
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-guide-modal', handleOpen);
    return () => window.removeEventListener('open-guide-modal', handleOpen);
  }, []);

  const currentStage = stages[currentStep];

  const handleJumpToStep = (idx) => {
    setDirection(idx >= currentStep ? 1 : -1);
    setCurrentStep(idx);
  };

  const handleNext = () => {
    if (currentStep < stages.length - 1) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    } else {
      setDirection(-1);
      setCurrentStep(0);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <>
      {/* Step Transition Animation Styles (self-contained, disabled on motion-reduce) */}
      <style>{`
        @keyframes guideSlideFwd {
          from {
            opacity: 0;
            transform: translateX(14px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes guideSlideRev {
          from {
            opacity: 0;
            transform: translateX(-14px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .guide-step-motion {
            animation: none !important;
          }
        }
      `}</style>

      {/* Sticky Floating Guide Button (Lower Left - ONLY on /tracker) */}
      {isTrackerPage && (
        <aside aria-label="System guide">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className={`fixed bottom-6 left-6 z-50 w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md border focus-visible:outline-2 focus-visible:outline-offset-2 ${
              darkMode
                ? 'bg-[#16161b] text-[#ff6a1a] border-[#26262e] shadow-black/60 hover:bg-[#202028] hover:border-orange-500/50 focus-visible:outline-[#ff6a1a]'
                : 'bg-white text-[#e8500a] border-[#e4e1dc] shadow-md shadow-neutral-900/10 hover:bg-[#f6f4f1] hover:border-orange-500/50 focus-visible:outline-[#e8500a]'
            }`}
            title="Workout Guide & System Tour"
            aria-label="Open workout guide"
          >
            <BookOpen className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        </aside>
      )}

      {/* Guide Modal Overlay */}
      {isOpen && (
        <div
          className={`fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm transition-all duration-200 ${
            darkMode ? 'bg-black/80' : 'bg-black/55'
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="guide-modal-title"
        >
          {/* Card wrapper: max-w-[560px] mx-auto rounded-[18px] */}
          <div
            className={`relative w-full max-w-[560px] mx-auto rounded-[18px] border p-5 shadow-2xl max-h-[94vh] overflow-y-auto no-scrollbar transition-colors duration-200 ${
              darkMode
                ? 'border-[#26262e] bg-[#16161b] text-zinc-100 shadow-black/80'
                : 'border-[#E8E4DE] bg-[#FFFFFF] text-[#1F1B18] shadow-[0_20px_50px_rgba(31,27,24,0.14)]'
            }`}
          >
            {/* Close button (accessible top-right) */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer border ${
                darkMode
                  ? 'border-[#26262e] bg-[#0f0f13] text-zinc-400 hover:text-white hover:bg-[#202028]'
                  : 'border-[#E8E4DE] bg-[#F7F5F2] text-[#716C64] hover:text-[#1F1B18] hover:bg-[#EFECE6]'
              } focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6a1a]`}
              aria-label="Close guide"
              title="Close guide"
            >
              <X className="w-4 h-4" />
            </button>

            {/* 1) Header row: flex items-baseline justify-between mb-2.5 */}
            <div className="flex items-baseline justify-between mb-2.5 pr-8">
              <span
                id="guide-modal-title"
                className={`text-base font-bold ${darkMode ? 'text-zinc-400' : 'text-[#716C64]'}`}
              >
                How to use the workout tracker
              </span>
              <span
                className={`text-[13px] font-semibold ${darkMode ? 'text-zinc-400' : 'text-[#716C64]'}`}
              >
                Step {currentStep + 1} of {stages.length}
              </span>
            </div>

            {/* 2) Progress bar: flex gap-1.5 mb-4 */}
            <div className="flex gap-1.5 mb-4" role="tablist" aria-label="Guide progress">
              {stages.map((st, idx) => {
                const isCurrent = idx === currentStep;
                const isDoneOrCurrent = idx <= currentStep;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleJumpToStep(idx)}
                    className="flex h-[26px] flex-1 items-center cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6a1a] rounded"
                    aria-label={`Step ${idx + 1}: ${st.title}`}
                    aria-selected={isCurrent}
                    role="tab"
                  >
                    <span
                      className={`w-full rounded transition-colors ${
                        isDoneOrCurrent
                          ? 'bg-[#ff6a1a]'
                          : darkMode
                            ? 'bg-[#26262e]'
                            : 'bg-[#E8E4DE]'
                      } ${isCurrent ? 'h-1.5' : 'h-1'}`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Animated Step Content Container: 250ms fade + 14px horizontal slide */}
            <div
              key={currentStep}
              className="guide-step-motion"
              style={{
                animation: `${direction >= 0 ? 'guideSlideFwd' : 'guideSlideRev'} 250ms ease-out forwards`,
              }}
              aria-live="polite"
            >
              {/* 3) Stage title: text-[22px] font-extrabold leading-tight */}
              <h3
                className={`text-[22px] font-extrabold leading-tight ${
                  darkMode ? 'text-zinc-100' : 'text-[#1F1B18]'
                }`}
              >
                {currentStage.title}
              </h3>

              {/* 4) doText: mt-1.5 mb-4 text-[15px] */}
              <p
                className={`mt-1.5 mb-4 text-[15px] ${
                  darkMode ? 'text-zinc-300' : 'text-[#4A463F]'
                }`}
              >
                {currentStage.doText}
              </p>

              {/* 5) Illustration panel: Real system website screenshot */}
              <div
                className={`overflow-hidden rounded-[14px] border transition-colors shadow-inner ${
                  darkMode
                    ? 'border-[#26262e] bg-[#0f0f13]'
                    : 'border-[#E8E4DE] bg-[#F7F5F2]'
                }`}
              >
                <img
                  src={darkMode ? currentStage.imageDark : currentStage.imageLight}
                  alt={currentStage.title}
                  className="w-full h-auto object-contain max-h-[260px] select-none block transition-opacity duration-200"
                  loading="eager"
                />
              </div>

              {/* 6) detail: mt-3.5 text-sm */}
              <p
                className={`mt-3.5 text-sm leading-relaxed ${
                  darkMode ? 'text-zinc-400' : 'text-[#5C574F]'
                }`}
              >
                {currentStage.detail}
              </p>

              {/* 7) Tips: ONE bordered panel, not separate cards */}
              <ul
                className={`mt-3.5 divide-y overflow-hidden rounded-xl border transition-colors ${
                  darkMode
                    ? 'border-[#26262e] bg-[#0f0f13] divide-[#26262e]'
                    : 'border-[#E8E4DE] bg-[#FAF8F5] divide-[#E8E4DE]'
                }`}
              >
                {currentStage.tips.map((tip, idx) => (
                  <li
                    key={idx}
                    className={`flex items-center gap-3 px-3.5 py-[11px] text-sm ${
                      darkMode ? 'text-zinc-100' : 'text-[#2E2A25]'
                    }`}
                  >
                    <span
                      className={`grid h-[22px] w-[22px] flex-none place-items-center rounded-full ${
                        darkMode ? 'bg-[#2a1b13] text-[#ff6a1a]' : 'bg-[#FFEDE3] text-[#E8500A]'
                      }`}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="2.5 6 4.8 8.5 9.5 3.5" />
                      </svg>
                    </span>
                    <span className="leading-snug">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 8) Footer: mt-5 flex justify-between gap-2.5 */}
            <div className="mt-5 flex justify-between gap-2.5">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 0}
                className={`rounded-[10px] border px-5 py-[11px] text-sm font-bold disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6a1a] ${
                  darkMode
                    ? 'border-[#26262e] text-zinc-100 hover:bg-[#202028]'
                    : 'border-[#D9D4CC] text-[#2E2A25] hover:bg-[#EFECE6]'
                }`}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="ml-auto rounded-[10px] bg-[#ff6a1a] px-5 py-[11px] text-sm font-bold text-white cursor-pointer hover:opacity-95 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6a1a]"
              >
                {currentStep === stages.length - 1 ? 'Start over' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
