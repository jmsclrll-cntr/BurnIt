import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';

const OBSTACLES = [
  {
    problem: 'Guessing how many calories you burned',
    fix: 'Your predicted burn is ready as soon as you finish.',
  },
  {
    problem: 'Losing count mid-set',
    fix: 'Reps are counted for you, so you can focus on moving.',
  },
  {
    problem: 'Typing every workout into a log',
    fix: 'Each session is saved automatically.',
  },
  {
    problem: 'Needing a watch or band',
    fix: 'Runs on the camera you already own.',
  },
  {
    problem: 'Not seeing progress',
    fix: 'Weekly totals show reps and calories over time.',
  },
];

const FLIP_CARDS = [
  {
    id: 'form-tracking',
    title: 'Unchecked Form & Cheated Reps',
    challenge: 'Exercising alone without guidance leads to improper posture, knee strain, and back injury.',
    scenarioFront: 'You squat in front of the mirror, unaware your lower back is rounding until your spine aches the next morning.',
    solution: 'Real-time 33-point pose estimation measures joint angles (knees, hips, elbows, spine) at 30+ FPS, validating full depth on every repetition.',
    scenarioBack: 'Live computer vision confirms each rep with biometric precision, ensuring you train with perfect form and zero cheated reps.',
  },
  {
    id: 'calorie-prediction',
    title: 'Inaccurate Calorie Estimates & Costly Wearables',
    challenge: 'Generic fitness apps guess calories with static lookup tables, while wearable smartwatches cost hundreds of dollars.',
    scenarioFront: 'You finish an exhausting 20-minute workout and an app guesses "120 kcal" with zero regard for your actual physical intensity.',
    solution: 'Built-in machine learning models calculate your personalized calorie burn using movement cadence, duration, reps, and body metrics.',
    scenarioBack: 'You get scientifically backed caloric burn estimates immediately after finishing your workout—no Apple Watch or heart-rate monitor required.',
  },
  {
    id: 'hands-free-logging',
    title: 'Tedious Manual Logging That Breaks Momentum',
    challenge: 'Stopping mid-workout to unlock your phone, tap screens, and type into a logbook ruins your workout rhythm and rest flow.',
    scenarioFront: 'You finish a set with sweaty hands, fumble with a phone screen to log rep numbers, and lose track of your rest interval.',
    solution: 'Hands-free automated exercise detection recognizes your workout, counts reps automatically, and triggers a 10-second rest countdown.',
    scenarioBack: 'You just step in front of your camera and move—your reps, sets, and workout duration log themselves into your history automatically.',
  },
  {
    id: 'privacy',
    title: 'Privacy Concerns of Camera-Based Fitness',
    challenge: 'Many AI workout applications upload your live camera feed or private home video footage to external cloud servers.',
    scenarioFront: 'Feeling hesitant to exercise in your bedroom or living space because you are unsure where your video stream is being stored.',
    solution: '100% client-side in-browser inference: pose tracking models run locally on your device hardware with zero video recorded or transmitted.',
    scenarioBack: 'You get state-of-the-art computer vision coaching with complete peace of mind—your video never leaves your browser.',
  },
];

export function ObstaclesFlipCards() {
  const { darkMode } = useTheme();
  const [flippedCards, setFlippedCards] = useState({});

  const toggleFlip = (id) => {
    setFlippedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section
      id="obstacles-solved"
      className={`w-full min-h-screen flex items-center py-14 sm:py-22 border-t transition-colors duration-200 ${darkMode
          ? 'bg-[#0f1015] text-[#f5f3ef] border-[#2a2a34]'
          : 'bg-[#f6f4f1] text-[#17171c] border-[#dcd8d2]'
        }`}
      aria-label="The common workout obstacles we solve"
    >
      <div className="max-w-[1120px] w-full mx-auto px-6 flex flex-col">
        {/* Header */}
        <div className="text-left">
          <h2 className="text-[clamp(1.8rem,3.8vw,2.8rem)] font-extrabold tracking-[-0.025em] leading-[1.15] m-0 text-left">
            The common workout obstacles
            <span className="block text-[clamp(2.4rem,5.2vw,3.8rem)] font-black text-[#ff6a1a] tracking-[-0.03em] leading-[1.05] mt-1.5">
              We Solve
            </span>
          </h2>
          <p
            className={`mt-4 max-w-[60ch] text-[1.05rem] leading-[1.6] text-left ${darkMode ? 'text-[#a3a3b0]' : 'text-[#5d5d68]'
              }`}
          >
            Why millions abandon fitness routines—and how BURN IT bridges every gap through accessible software.
          </p>
        </div>

        {/* 2x2 Grid of Flip Cards */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 items-stretch"
          role="region"
          aria-label="Obstacles flip cards"
        >
          {FLIP_CARDS.map((card) => {
            const isFlipped = !!flippedCards[card.id];
            return (
              <button
                key={card.id}
                type="button"
                className="relative [perspective:1200px] bg-transparent border-0 p-0 cursor-pointer w-full text-left block outline-none rounded-[24px] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#ff6a1a] focus-visible:outline-offset-[3px] group"
                onClick={() => toggleFlip(card.id)}
                aria-label={`${card.title}. Click to ${isFlipped ? 'flip to challenge' : 'flip to solution'
                  }`}
              >
                <div
                  className={`relative w-full h-full min-h-[270px] sm:min-h-[250px] [transform-style:preserve-3d] transition-transform duration-[1200ms] ease-in-out will-change-transform rounded-[24px] motion-reduce:transition-none group-hover:[transform:rotateY(180deg)] group-focus-visible:[transform:rotateY(180deg)] ${
                    isFlipped ? '[transform:rotateY(180deg)]' : ''
                  }`}
                >
                  {/* FRONT: Challenge */}
                  <div
                    className={`w-full h-full rounded-[24px] p-7 sm:p-8 [backface-visibility:hidden] [transform:rotateY(0deg)] flex flex-col border ${
                  darkMode
                    ? 'bg-[#171821] border-[#262730] text-[#f5f3ef]'
                    : 'bg-white border-[#e5e3de] text-[#17171c]'
                }`}
                  >
                <h3 className="text-[1.35rem] font-extrabold leading-[1.25] tracking-[-0.015em] mb-4.5">
                  {card.title}
                </h3>

                <div className="mt-0">
                  <span
                    className={`block font-extrabold text-[0.85rem] mb-1 ${darkMode ? 'text-[#ff4d4f]' : 'text-[#dc2626]'
                      }`}
                  >
                    The challenge:
                  </span>
                  <p
                    className={`m-0 text-[0.95rem] leading-[1.5] ${darkMode ? 'text-[#a3a3b0]' : 'text-[#5d5d68]'
                      }`}
                  >
                    {card.challenge}
                  </p>
                </div>

                <div className="mt-3.5">
                  <span
                    className={`block font-extrabold text-[0.85rem] mb-1 ${darkMode ? 'text-[#ff4d4f]' : 'text-[#dc2626]'
                      }`}
                  >
                    What it looks like:
                  </span>
                  <p
                    className={`m-0 text-[0.95rem] leading-[1.5] ${darkMode ? 'text-[#a3a3b0]' : 'text-[#5d5d68]'
                      }`}
                  >
                    {card.scenarioFront}
                  </p>
                </div>
              </div>

                  {/* BACK: Solution */ }
            <div className="absolute inset-0 w-full h-full rounded-[24px] p-7 sm:p-8 bg-[#ff8a3d] text-[#17171c] [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col justify-center shadow-[0_16px_40px_-16px_rgba(255,138,61,0.4)]">
              <div>
                <span className="block font-extrabold text-[0.85rem] text-[#17171c] mb-1">
                  The Burn It solution:
                </span>
                <p className="m-0 text-[0.98rem] font-medium leading-[1.55] text-[#17171c]">
                  {card.solution}
                </p>
              </div>

              <div className="mt-3.5">
                <span className="block font-extrabold text-[0.85rem] text-[#17171c] mb-1">
                  How it helps:
                </span>
                <p className="m-0 text-[0.98rem] font-medium leading-[1.55] text-[#17171c]">
                  {card.scenarioBack}
                </p>
              </div>
            </div>
                </div>
      </button>
      );
          })}
    </div>
      </div >
    </section >
  );
}

export default function AboutBurnIt() {
  const { darkMode } = useTheme();
  const kcal = 142;
  const [openObstacle, setOpenObstacle] = useState(0);

  const toggleObstacle = (index) => {
    setOpenObstacle((prev) => (prev === index ? null : index));
  };

  return (
    <div
      id="about"
      className={`w-full font-['Archivo',sans-serif] leading-relaxed transition-colors duration-200 ${darkMode ? 'bg-[#0e0e13] text-[#f5f3ef]' : 'bg-[#f6f4f1] text-[#17171c]'
        }`}
      aria-label="About BURN IT"
    >
      <div className="max-w-[1120px] mx-auto px-6">
        {/* ========================================================= */}
        {/* SECTION 1: HERO                                           */}
        {/* ========================================================= */}
        <div className="py-14 sm:pt-[88px] sm:pb-16 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 items-center">
          {/* Left Column */}
          <div className="text-left">
            <h1 className="text-[clamp(2.3rem,5.2vw,4.1rem)] font-black leading-[1.03] tracking-[-0.03em] m-0 text-left">
              Finish your workout. Get your{' '}
              <span className="text-[#ff6a1a] font-black not-italic">
                calorie burn
              </span>{' '}
              and rep summary
            </h1>
            <p
              className={`mt-6 max-w-[52ch] text-[1.08rem] leading-[1.6] text-left ${darkMode ? 'text-[#a3a3b0]' : 'text-[#5d5d68]'
                }`}
            >
              Work out in front of your camera. When you finish, BURN IT shows
              how many reps you did and predicts how many calories you burned,
              based on your exercises, body weight and effort. Everything is
              analyzed in your browser, with no wearables, no subscriptions and
              no video uploaded.
            </p>
          </div>

          {/* Right Column: Workout Complete Card */}
          <div
            className={`rounded-[24px] p-7 sm:p-8 border shadow-xl ${darkMode
                ? 'bg-[#16161d] border-[#2a2a34]'
                : 'bg-white border-[#dcd8d2]'
              }`}
            role="region"
            aria-label="Workout complete summary card"
          >
            {/* Header row */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-[1.9rem] font-black tracking-[-0.02em] leading-[1.2] m-0">
                  Workout complete
                </h3>
                <div
                  className={`text-[0.9rem] mt-1 ${darkMode ? 'text-[#a3a3b0]' : 'text-[#5d5d68]'
                    }`}
                >
                  Here's your estimated burn.
                </div>
              </div>
              <button
                type="button"
                className={`bg-transparent border-0 text-[1.6rem] leading-none cursor-pointer p-1 rounded ${darkMode
                    ? 'text-[#a3a3b0] hover:text-[#f5f3ef]'
                    : 'text-[#5d5d68] hover:text-[#17171c]'
                  }`}
                aria-label="Close summary"
              >
                ×
              </button>
            </div>

            {/* Result block */}
            <div className="text-center mt-7">
              <div
                className="text-[6rem] font-black leading-none tracking-[-0.03em] text-[#ff6a1a]"
                aria-live="polite"
                aria-atomic="true"
              >
                {kcal}
              </div>
              <div
                className={`text-[0.85rem] mt-1.5 ${darkMode ? 'text-[#a3a3b0]' : 'text-[#5d5d68]'
                  }`}
              >
                kcal burned
              </div>
            </div>

            {/* Centered duration stat like original UI */}
            <div className="flex justify-center text-center mt-5">
              <div className="flex flex-col items-center">
                <span className="text-[1.85rem] font-bold font-mono leading-tight">
                  12:40
                </span>
                <span
                  className={`text-[0.85rem] mt-1 ${darkMode ? 'text-[#a3a3b0]' : 'text-[#5d5d68]'
                    }`}
                >
                  duration
                </span>
              </div>
            </div>

            {/* Heart-rate block (static, non-editable on home page) */}
            <div className="mt-7">
              <div
                className={`block text-left text-[0.85rem] mb-2 ${darkMode ? 'text-[#a3a3b0]' : 'text-[#5d5d68]'
                  }`}
              >
                Average heart rate
              </div>
              <div
                className={`w-full flex items-center justify-between h-12 px-4 rounded-[14px] border ${darkMode
                    ? 'bg-[#0e0e13] border-[#2a2a34]'
                    : 'bg-[#f6f4f1] border-[#dcd8d2]'
                  }`}
              >
                <span className="font-bold text-base select-text">138</span>
                <span
                  className={`text-[0.8rem] font-semibold select-none ${darkMode ? 'text-[#a3a3b0]' : 'text-[#5d5d68]'
                    }`}
                  aria-hidden="true"
                >
                  BPM
                </span>
              </div>
            </div>

            {/* Primary button */}
            <button
              type="button"
              className="w-full h-12 mt-4 rounded-[14px] bg-[#ff6a1a] hover:bg-[#ff7a29] text-white font-extrabold text-[0.92rem] transition-colors cursor-pointer border-0 outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#ff6a1a] focus-visible:outline-offset-2"
            >
              Start new session
            </button>

            {/* Text link button */}
            <button
              type="button"
              className={`w-full text-center mt-3.5 bg-transparent border-0 font-medium text-[0.85rem] cursor-pointer outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#ff6a1a] focus-visible:outline-offset-2 ${darkMode
                  ? 'text-[#a3a3b0] hover:text-[#f5f3ef]'
                  : 'text-[#5d5d68] hover:text-[#17171c]'
                }`}
            >
              Return to dashboard
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: FEATURE STRIP                                  */}
        {/* ========================================================= */}
        <div
          className={`grid grid-cols-2 md:grid-cols-4 border-y ${darkMode ? 'border-[#2a2a34]' : 'border-[#dcd8d2]'
            }`}
        >
          <div
            className={`py-7 px-4 sm:px-6 border-l first:border-l-0 ${darkMode ? 'border-[#2a2a34]' : 'border-[#dcd8d2]'
              }`}
          >
            <h4 className="text-sm font-bold m-0 leading-tight">
              Camera rep counting
            </h4>
            <div
              className={`text-xs mt-1.5 leading-relaxed ${darkMode ? 'text-[#a3a3b0]' : 'text-[#5d5d68]'
                }`}
            >
              Reps are counted from your recorded movement.
            </div>
          </div>

          <div
            className={`py-7 px-4 sm:px-6 border-l ${darkMode ? 'border-[#2a2a34]' : 'border-[#dcd8d2]'
              }`}
          >
            <h4 className="text-sm font-bold m-0 leading-tight">
              Calorie prediction
            </h4>
            <div
              className={`text-xs mt-1.5 leading-relaxed ${darkMode ? 'text-[#a3a3b0]' : 'text-[#5d5d68]'
                }`}
            >
              Estimated from your exercise, weight and effort.
            </div>
          </div>

          <div
            className={`py-7 px-4 sm:px-6 border-l ${darkMode ? 'border-[#2a2a34]' : 'border-[#dcd8d2]'
              }`}
          >
            <h4 className="text-sm font-bold m-0 leading-tight">
              Private by design
            </h4>
            <div
              className={`text-xs mt-1.5 leading-relaxed ${darkMode ? 'text-[#a3a3b0]' : 'text-[#5d5d68]'
                }`}
            >
              Video is processed on your device, never uploaded.
            </div>
          </div>

          <div
            className={`py-7 px-4 sm:px-6 border-l ${darkMode ? 'border-[#2a2a34]' : 'border-[#dcd8d2]'
              }`}
          >
            <h4 className="text-sm font-bold m-0 leading-tight">
              Workout history
            </h4>
            <div
              className={`text-xs mt-1.5 leading-relaxed ${darkMode ? 'text-[#a3a3b0]' : 'text-[#5d5d68]'
                }`}
            >
              Every summary is saved so you can see your trend.
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 3: OBSTACLES (DROPDOWN ACCORDION)                 */}
        {/* ========================================================= */}
        <div className="py-14 sm:py-24 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left Column */}
          <div className="sticky top-24 self-start text-left">
            <h2 className="text-[clamp(1.8rem,3.4vw,2.6rem)] font-black leading-[1.1] tracking-[-0.02em] m-0 text-left">
              Why people stop tracking their workouts
            </h2>
            <p
              className={`mt-4 max-w-[36ch] text-[1.05rem] leading-[1.6] text-left ${darkMode ? 'text-[#a3a3b0]' : 'text-[#5d5d68]'
                }`}
            >
              Logging is tedious and guesses are unreliable. BURN IT handles
              both.
            </p>
          </div>

          {/* Right Column: Dropdown Accordion List */}
          <div
            className="flex flex-col w-full"
            role="region"
            aria-label="Workout obstacles and solutions"
          >
            {OBSTACLES.map((item, index) => {
              const isOpen = openObstacle === index;
              return (
                <div
                  key={item.problem}
                  className={`border-t last:border-b transition-colors ${darkMode ? 'border-[#2a2a34]' : 'border-[#dcd8d2]'
                    }`}
                >
                  <button
                    type="button"
                    className="w-full flex items-center justify-between gap-4 py-5.5 bg-transparent border-0 cursor-pointer text-left font-inherit outline-none min-h-[48px] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#ff6a1a] focus-visible:outline-offset-2"
                    onClick={() => toggleObstacle(index)}
                    aria-expanded={isOpen}
                    aria-controls={`obstacle-content-${index}`}
                    id={`obstacle-header-${index}`}
                  >
                    <span
                      className={`text-[1.05rem] font-semibold line-through decoration-[#ff6a1a] decoration-2 leading-[1.5] transition-colors ${isOpen
                          ? darkMode
                            ? 'text-[#f5f3ef]'
                            : 'text-[#17171c]'
                          : darkMode
                            ? 'text-[#a3a3b0] hover:text-[#f5f3ef]'
                            : 'text-[#5d5d68] hover:text-[#17171c]'
                        }`}
                    >
                      {item.problem}
                    </span>
                    <span
                      className={`inline-flex items-center justify-center shrink-0 transition-transform duration-300 motion-reduce:transition-none ${isOpen
                          ? 'rotate-180 text-[#ff6a1a]'
                          : darkMode
                            ? 'text-[#a3a3b0]'
                            : 'text-[#5d5d68]'
                        }`}
                      aria-hidden="true"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </button>

                  <div
                    id={`obstacle-content-${index}`}
                    role="region"
                    aria-labelledby={`obstacle-header-${index}`}
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${isOpen
                        ? 'grid-rows-[1fr] opacity-100'
                        : 'grid-rows-[0fr] opacity-0'
                      }`}
                  >
                    <div className="overflow-hidden">
                      <div className="flex items-start gap-3 pb-5.5">
                        <span
                          className="w-[3px] h-[22px] bg-[#ff6a1a] rounded-sm shrink-0 mt-[3px]"
                          aria-hidden="true"
                        />
                        <p className="m-0 font-medium leading-[1.6] text-[1.02rem]">
                          {item.fix}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 4: FLIP CARDS (OBSTACLES SOLVED)                  */}
      {/* ========================================================= */}
      <ObstaclesFlipCards />
    </div>
  );
}
