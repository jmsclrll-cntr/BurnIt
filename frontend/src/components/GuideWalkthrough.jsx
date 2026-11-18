import React, { useState, useEffect } from 'react';

const STEPS = [
  {
    railLabel: 'Create account',
    heading: 'Create your free account',
    paragraph:
      'Open BURN IT in any modern browser and choose a username and password. No download and no install, and you can start the same minute.',
    imageLight: '/guide/guide_step1_auth_light.png?v=clean-v3',
    imageDark: '/guide/guide_step1_auth_dark.png?v=clean-v3',
    alt: 'Create your free account - Sign up and log in screen',
  },
  {
    railLabel: 'Open tracker',
    heading: 'Open the workout tracker',
    paragraph:
      'Sign in and the tracker opens right away. Turn on your camera, step back until your whole body is in view, and use good light and a plain background.',
    imageLight: '/guide/guide_step2_camera_light.png?v=clean-v3',
    imageDark: '/guide/guide_step2_camera_dark.png?v=clean-v3',
    alt: 'Open the workout tracker - Camera off standby screen',
  },
  {
    railLabel: 'Pick exercise',
    heading: 'Choose an exercise',
    paragraph:
      'Select the movement you want to train, or leave it on Auto-detect. Add the weight you are lifting for exercises like bicep curls.',
    imageLight: '/guide/guide_step3_exercise_light.png?v=clean-v3',
    imageDark: '/guide/guide_step3_exercise_dark.png?v=clean-v3',
    alt: 'Choose an exercise - Bicep curls selected with weight input',
  },
  {
    railLabel: 'Track live',
    heading: 'Track your joint angles live',
    paragraph:
      'Your skeleton and joint angles appear on screen as you move. Reps are counted automatically and your form precision updates as you go.',
    imageLight: '/guide/guide_step4_tracking_light.png?v=clean-v3',
    imageDark: '/guide/guide_step4_tracking_dark.png?v=clean-v3',
    alt: 'Track your joint angles live - Biometric pose skeleton',
  },
  {
    railLabel: 'Predict calories',
    heading: 'Finish and predict calories',
    paragraph:
      'When you are done, tap Finish, enter your average heart rate and get an estimate of the calories you burned.',
    imageLight: '/guide/guide_step5_calories_light.png?v=clean-v3',
    imageDark: '/guide/guide_step5_calories_dark.png?v=clean-v3',
    alt: 'Finish and predict calories - Workout complete dialog',
  },
  {
    railLabel: 'Review profile',
    heading: 'Track your progress & history in Profile',
    paragraph:
      'Click your avatar in the navigation bar to open your Fitness Profile. Your biometrics are used for calorie estimates, and you can review past workouts and click any entry for a full breakdown.',
    imageLight: '/guide/guide_step6_profile_light.png?v=clean-v3',
    imageDark: '/guide/guide_step6_profile_dark.png?v=clean-v3',
    alt: 'Track your progress & history in Profile - Biometrics and workout history',
  },
];

export default function GuideWalkthrough() {
  const [currentStep, setCurrentStep] = useState(0);

  // Left and right arrow keys navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') {
        setCurrentStep((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentStep((prev) => (prev === STEPS.length - 1 ? 0 : prev + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNext = () => {
    setCurrentStep((prev) => (prev === STEPS.length - 1 ? 0 : prev + 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const currentStepData = STEPS[currentStep];

  return (
    <div className="w-full max-w-[1120px] mx-auto space-y-10 sm:space-y-12">
      {/* Header */}
      <header className="space-y-4 sm:space-y-5">
        <h1
          style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 900, letterSpacing: '-0.03em' }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-[58px] xl:text-[62px] font-black leading-[1.08] text-[#0F0F0F] dark:text-[#F7F7F7] whitespace-normal min-[960px]:whitespace-nowrap"
        >
          Getting started with <span className="text-[#3641C9] dark:text-[#8A9CF7]">BURN IT.</span>
        </h1>
        <p className="text-base sm:text-lg leading-relaxed text-[#5D5D68] dark:text-[#A3A3B0] max-w-[62ch]">
          Turn any web browser into your personal AI coach in seconds. Follow these six simple steps to create your account, calibrate your camera, track joint angles in real time, and monitor your long-term fitness progress.
        </p>
      </header>

      {/* Step rail: horizontal row of 6 equal columns */}
      <nav aria-label="Walkthrough progress" className="relative">
        {/* 2px - 3px background line behind dots (spanning center of 1st dot to center of 6th dot) */}
        <div
          className="absolute top-[20px] -translate-y-1/2 left-[calc(100%/12)] right-[calc(100%/12)] h-[2.5px] bg-[#E2E4E9] dark:bg-[#262630] rounded-full overflow-hidden pointer-events-none -z-0"
          aria-hidden="true"
        >
          {/* Accent colored progress line fill */}
          <div
            className="h-full bg-[#3641C9] dark:bg-[#8A9CF7] rounded-full transition-all duration-350 ease-out motion-reduce:transition-none"
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {/* Dots + Labels */}
        <div className="relative grid grid-cols-6 items-start gap-1">
          {STEPS.map((step, idx) => {
            const isPast = idx < currentStep;
            const isCurrent = idx === currentStep;
            return (
              <button
                key={step.railLabel}
                type="button"
                onClick={() => setCurrentStep(idx)}
                aria-label={`Step ${idx + 1}: ${step.railLabel}`}
                aria-current={isCurrent ? 'step' : undefined}
                className="group relative z-10 flex flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3641C9] dark:focus-visible:ring-[#8A9CF7] rounded-xl p-1 cursor-pointer"
              >
                {/* 40px circular numbered dot */}
                <span
                  style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-extrabold transition-all duration-300 select-none ${isCurrent
                    ? 'bg-[#3641C9] text-white ring-[6px] ring-[#3641C9]/30 shadow-[0_0_16px_rgba(54,65,201,0.45)] dark:bg-[#8A9CF7] dark:text-[#14006A] dark:ring-[#8A9CF7]/30 dark:shadow-[0_0_16px_rgba(138,156,247,0.45)]'
                    : isPast
                      ? 'bg-[#3641C9] text-white dark:bg-[#8A9CF7] dark:text-[#14006A]'
                      : 'bg-white dark:bg-[#16161D] text-[#5D5D68] dark:text-[#A3A3B0] border border-[#E2E4E9] dark:border-[#262630] group-hover:border-[#3641C9]/60'
                    }`}
                >
                  {idx + 1}
                </span>

                {/* Step label with active indicator */}
                <span className="hidden min-[820px]:flex flex-col items-center mt-2.5">
                  <span
                    className={`text-xs sm:text-sm text-center transition-colors duration-200 select-none ${isCurrent
                      ? 'text-[#0F0F0F] dark:text-[#F7F7F7] font-semibold'
                      : 'text-[#5D5D68] dark:text-[#71717A] group-hover:text-[#0F0F0F] dark:group-hover:text-[#F7F7F7]'
                      }`}
                  >
                    {step.railLabel}
                  </span>
                  {isCurrent && (
                    <span className="w-full max-w-[60px] h-[2px] bg-[#3641C9] dark:bg-[#8A9CF7] rounded-full mt-1 animate-in fade-in duration-200" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Panel under the rail: rounded card (28px radius, 1px border), 30/70 split */}
      <div className="w-full rounded-[28px] border border-[#E2E4E9] dark:border-[#262630] bg-white dark:bg-[#16161D] p-6 sm:p-10 lg:p-12 shadow-xl shadow-black/5 dark:shadow-black/40 transition-colors duration-300">
        <div className="flex flex-col min-[820px]:flex-row items-center gap-8 lg:gap-12">
          {/* Left Column (30%) */}
          <div
            className="w-full min-[820px]:w-[32%] shrink-0 flex flex-col justify-center"
            aria-live="polite"
          >
            <h2
              style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 800, textWrap: 'balance' }}
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0F0F0F] dark:text-[#F7F7F7] tracking-tight leading-[1.15]"
            >
              {currentStepData.heading}
            </h2>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-[#5D5D68] dark:text-[#A3A3B0] max-w-[40ch]">
              {currentStepData.paragraph}
            </p>
            <div className="mt-8 flex items-center gap-3.5 flex-wrap">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="px-5 py-2 rounded-full border border-[#E2E4E9] dark:border-neutral-700/80 text-[#0F0F0F] dark:text-neutral-300 hover:text-black dark:hover:text-white hover:border-[#3641C9] disabled:opacity-30 disabled:cursor-not-allowed text-sm font-semibold transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#3641C9]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2 rounded-full bg-[#3641C9] hover:bg-[#2C35A8] text-white text-sm font-bold shadow-md shadow-[#3641C9]/25 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#3641C9]"
              >
                {currentStep === STEPS.length - 1 ? 'Start over' : 'Next step'}
              </button>
              <span className="text-xs text-[#5f5a52] dark:text-neutral-500 select-none ml-1">
                or use &larr; &rarr;
              </span>
            </div>
          </div>

          {/* Right Column (70%) - Clean tightly cropped screenshot, fixed height */}
          <div className="w-full min-[820px]:w-[68%] h-[420px] min-[820px]:h-[460px] flex items-center justify-center overflow-hidden">
            <img
              src={currentStepData.imageLight}
              alt={currentStepData.alt}
              className="w-full h-full object-contain max-h-full rounded-[16px] block dark:hidden select-none"
              loading="eager"
            />
            <img
              src={currentStepData.imageDark}
              alt={currentStepData.alt}
              className="w-full h-full object-contain max-h-full rounded-[16px] hidden dark:block select-none"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

