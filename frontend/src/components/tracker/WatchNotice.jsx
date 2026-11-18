import React, { useState } from 'react';
import { useTheme } from '../../hooks/useTheme';

/**
 * WatchNotice Component
 * Two-panel smartwatch onboarding notice before entering the workout tracker.
 * Fully supports Light Mode and Dark Mode with smooth color transitions.
 *
 * Left panel: Tinted indigo container with animated smartwatch illustration (inline SVG).
 * Right panel: Explanation, 3 step cards, confirmation checkbox, and entry/skip actions.
 */
export default function WatchNotice({ onProceed }) {
  const { darkMode } = useTheme();
  const [isWatchOn, setIsWatchOn] = useState(false);

  const handleEnter = () => {
    if (!isWatchOn) return;
    if (onProceed) {
      onProceed('wearing');
    }
  };

  const handleSkip = () => {
    if (onProceed) {
      onProceed('skipped');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F4F5F8] dark:bg-[#0A0A0E] text-[#0F0F0F] dark:text-[#F7F7F7] flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans selection:bg-[#3641C9] selection:text-white transition-colors duration-300">
      {/* Scoped Keyframe Animation for gentle heart pulse */}
      <style>{`
        @keyframes gentleHeartPulse {
          0%, 100% {
            transform: scale(1);
          }
          15% {
            transform: scale(1.15);
          }
          30% {
            transform: scale(1);
          }
          45% {
            transform: scale(1.1);
          }
        }
        .animate-heart-pulse {
          animation: gentleHeartPulse 1.6s ease-in-out infinite;
          transform-origin: center;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-heart-pulse {
            animation: none !important;
          }
        }
      `}</style>

      {/* Main Two-Panel Card */}
      <div className="w-full max-w-4xl lg:max-w-5xl bg-white dark:bg-[#13141E] rounded-[28px] sm:rounded-[32px] border border-[#E2E4E9] dark:border-white/10 shadow-[0_20px_50px_rgba(15,15,15,0.08)] dark:shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 animate-in fade-in zoom-in-95 duration-300 transition-colors duration-300">
        {/* Left Panel: Tinted Indigo Smartwatch Illustration */}
        <div className="md:col-span-5 bg-[#EEF2FF] dark:bg-[#20223A] flex items-center justify-center p-8 sm:p-10 md:p-12 relative overflow-hidden select-none transition-colors duration-300">
          {/* Subtle background glow */}
          <div className="absolute w-64 h-64 rounded-full bg-[#3641C9]/15 dark:bg-[#3641C9]/25 blur-3xl pointer-events-none transition-colors duration-300" />

          {/* Smartwatch SVG */}
          <svg
            className="w-56 sm:w-64 md:w-72 lg:w-80 h-auto drop-shadow-2xl relative z-10"
            viewBox="0 0 220 320"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Smartwatch displaying heart rate of 78 BPM"
          >
            {/* Top Strap */}
            <rect
              x="76"
              y="12"
              width="68"
              height="70"
              rx="16"
              fill={darkMode ? '#343754' : '#323554'}
            />
            {/* Top Strap Buckle Detail */}
            <rect
              x="86"
              y="28"
              width="48"
              height="8"
              rx="4"
              fill={darkMode ? '#25273C' : '#22243C'}
            />

            {/* Bottom Strap (extends seamlessly from behind watch case) */}
            <rect
              x="76"
              y="175"
              width="68"
              height="95"
              rx="16"
              fill={darkMode ? '#343754' : '#323554'}
            />
            {/* Bottom Strap Loop Detail */}
            <rect
              x="86"
              y="232"
              width="48"
              height="8"
              rx="4"
              fill={darkMode ? '#25273C' : '#22243C'}
            />

            {/* Watch Bezel / Outer Case */}
            <rect
              x="45"
              y="60"
              width="130"
              height="144"
              rx="38"
              fill="#181926"
            />
            <rect
              x="45"
              y="60"
              width="130"
              height="144"
              rx="38"
              stroke={darkMode ? '#3A3D59' : '#2C2E46'}
              strokeWidth="2.5"
            />

            {/* Watch Crown / Physical Button */}
            <rect
              x="175"
              y="114"
              width="6"
              height="36"
              rx="3"
              fill="#2B2D42"
            />

            {/* Watch Screen Display */}
            <rect
              x="53"
              y="68"
              width="114"
              height="128"
              rx="30"
              fill="#0D0E16"
            />

            {/* Pulsing Red Heart Icon */}
            <g className="animate-heart-pulse">
              <path
                d="M110 108.5C110 108.5 95 99 95 89.5C95 84.5 99 80.5 104 80.5C107 80.5 109 82 110 83.5C111 82 113 80.5 116 80.5C121 80.5 125 84.5 125 89.5C125 99 110 108.5 110 108.5Z"
                fill="#EF4444"
              />
            </g>

            {/* Big Heart Rate Value */}
            <text
              x="110"
              y="136"
              textAnchor="middle"
              fill="#FFFFFF"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="28"
              fontWeight="900"
              letterSpacing="-0.5"
            >
              78
            </text>

            {/* BPM · resting Subtext */}
            <text
              x="110"
              y="152"
              textAnchor="middle"
              fill="#8E95B8"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="9"
              fontWeight="600"
              letterSpacing="0.2"
            >
              BPM · resting
            </text>

            {/* Heart Pulse / ECG Line */}
            <path
              d="M68 168 L92 168 L96 163 L101 174 L107 160 L113 170 L118 168 L152 168"
              stroke="#5D6EFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Right Panel: Content, Steps & Actions */}
        <div className="md:col-span-7 p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-between text-left transition-colors duration-300">
          <div>
            {/* Heading */}
            <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-[#0F0F0F] dark:text-white tracking-tight leading-tight mb-3 transition-colors">
              Put on your smartwatch before you start
            </h1>

            {/* Description */}
            <p className="text-xs sm:text-sm lg:text-[15px] text-[#5D5D68] dark:text-neutral-400 font-normal leading-relaxed mb-6 transition-colors">
              Workout tracker uses your average heart rate to predict calories more accurately. Without it, we can only estimate from reps and duration.
            </p>

            {/* 3 Numbered Step Cards */}
            <div className="space-y-3 mb-6">
              {/* Step 1 */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F8F9FC] dark:bg-white/[0.03] border border-[#E2E4E9] dark:border-white/10 flex items-start gap-3.5 hover:bg-[#F0F2F9] dark:hover:bg-white/[0.05] transition-colors">
                <span className="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full bg-[#3641C9]/10 dark:bg-[#3641C9]/30 text-[#3641C9] dark:text-[#8A9CF7] text-xs sm:text-sm font-bold flex items-center justify-center shrink-0 mt-0.5 border border-[#3641C9]/25 dark:border-[#3641C9]/50 transition-colors">
                  1
                </span>
                <div>
                  <h2 className="text-xs sm:text-sm lg:text-[15px] font-bold text-[#0F0F0F] dark:text-white mb-0.5 transition-colors">
                    Wear it snug on your wrist
                  </h2>
                  <p className="text-[11px] sm:text-xs lg:text-[13px] text-[#5D5D68] dark:text-neutral-400 leading-normal transition-colors">
                    One finger width above the wrist bone, sensor against skin.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F8F9FC] dark:bg-white/[0.03] border border-[#E2E4E9] dark:border-white/10 flex items-start gap-3.5 hover:bg-[#F0F2F9] dark:hover:bg-white/[0.05] transition-colors">
                <span className="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full bg-[#3641C9]/10 dark:bg-[#3641C9]/30 text-[#3641C9] dark:text-[#8A9CF7] text-xs sm:text-sm font-bold flex items-center justify-center shrink-0 mt-0.5 border border-[#3641C9]/25 dark:border-[#3641C9]/50 transition-colors">
                  2
                </span>
                <div>
                  <h2 className="text-xs sm:text-sm lg:text-[15px] font-bold text-[#0F0F0F] dark:text-white mb-0.5 transition-colors">
                    Start a workout on the watch
                  </h2>
                  <p className="text-[11px] sm:text-xs lg:text-[13px] text-[#5D5D68] dark:text-neutral-400 leading-normal transition-colors">
                    Pick &ldquo;Other workout&rdquo; or &ldquo;Strength&rdquo; so it logs heart rate continuously.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F8F9FC] dark:bg-white/[0.03] border border-[#E2E4E9] dark:border-white/10 flex items-start gap-3.5 hover:bg-[#F0F2F9] dark:hover:bg-white/[0.05] transition-colors">
                <span className="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full bg-[#3641C9]/10 dark:bg-[#3641C9]/30 text-[#3641C9] dark:text-[#8A9CF7] text-xs sm:text-sm font-bold flex items-center justify-center shrink-0 mt-0.5 border border-[#3641C9]/25 dark:border-[#3641C9]/50 transition-colors">
                  3
                </span>
                <div>
                  <h2 className="text-xs sm:text-sm lg:text-[15px] font-bold text-[#0F0F0F] dark:text-white mb-0.5 transition-colors">
                    Come back and finish your set
                  </h2>
                  <p className="text-[11px] sm:text-xs lg:text-[13px] text-[#5D5D68] dark:text-neutral-400 leading-normal transition-colors">
                    We read your average heart rate when you tap &ldquo;Finish &amp; predict calories&rdquo;.
                  </p>
                </div>
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <div className="mb-6">
              <label
                htmlFor="watch-checkbox"
                className="inline-flex items-center gap-3 cursor-pointer select-none group"
              >
                <input
                  type="checkbox"
                  id="watch-checkbox"
                  checked={isWatchOn}
                  onChange={(e) => setIsWatchOn(e.target.checked)}
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded border-[#C5C8D4] dark:border-white/20 bg-white dark:bg-black/40 text-[#3641C9] focus:ring-2 focus:ring-[#3641C9]/50 focus:ring-offset-0 transition-all cursor-pointer accent-[#3641C9]"
                />
                <span className="text-xs sm:text-sm lg:text-[15px] font-medium text-[#2D2D38] dark:text-neutral-200 group-hover:text-[#0F0F0F] dark:group-hover:text-white transition-colors">
                  My smartwatch is on and tracking heart rate
                </span>
              </label>
            </div>
          </div>

          {/* Action Buttons & Footnote */}
          <div>
            <div className="flex items-center gap-3 mb-3 flex-wrap sm:flex-nowrap">
              {/* Primary: Enter Workout Tracker */}
              <button
                type="button"
                onClick={handleEnter}
                disabled={!isWatchOn}
                className={`flex-1 py-3.5 px-5 sm:px-6 rounded-xl font-bold text-xs sm:text-sm lg:text-[15px] text-white transition-all text-center focus-visible:ring-2 focus-visible:ring-[#3641C9] focus-visible:outline-none ${
                  isWatchOn
                    ? 'bg-[#3641C9] hover:bg-[#2C35A8] active:bg-[#14006A] shadow-lg shadow-[#3641C9]/30 cursor-pointer active:scale-[0.99]'
                    : 'bg-[#E5E7EB] dark:bg-[#25273C] text-[#8C90A0] dark:text-neutral-400 opacity-80 dark:opacity-60 cursor-not-allowed border border-[#D5D8E2] dark:border-white/5'
                }`}
              >
                Enter workout tracker
              </button>

              {/* Secondary: Skip For Now */}
              <button
                type="button"
                onClick={handleSkip}
                className="py-3.5 px-6 rounded-xl font-semibold text-xs sm:text-sm lg:text-[15px] text-[#2D2D38] dark:text-neutral-200 hover:text-[#0F0F0F] dark:hover:text-white bg-[#F0F2F5] dark:bg-white/5 hover:bg-[#E4E7EC] dark:hover:bg-white/10 active:bg-[#D8DCE4] dark:active:bg-white/15 border border-[#E2E4E9] dark:border-white/10 transition-all cursor-pointer active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#3641C9] focus-visible:outline-none"
              >
                Skip for now
              </button>
            </div>

            {/* Note */}
            <p className="text-[11px] sm:text-xs text-[#7A7E8F] dark:text-neutral-500 font-normal transition-colors">
              Skipping is fine, but calorie predictions will be less precise.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
