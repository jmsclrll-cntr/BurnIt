import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';

const EXERCISES = [
  {
    id: 'squat',
    name: 'Squat',
    desc: 'Knee and hip angle measurement, depth verification and back-lean checking on every rep.',
    gif: '/assets/squat.gif',
    focus: 'center 40%',
    alt: 'Person performing a bodyweight squat, side view',
  },
  {
    id: 'push-up',
    name: 'Push-Up',
    desc: 'Real-time elbow extension measurement, chest-to-floor depth verification, and full-body plank alignment.',
    gif: '/assets/push-up.gif',
    focus: 'center 50%',
    alt: 'Person performing a push-up, side view',
  },
  {
    id: 'plank',
    name: 'Plank',
    desc: 'Shoulder-to-ankle alignment tracking and an automatic hold timer.',
    gif: '/assets/plank.gif',
    focus: 'center 60%',
    alt: 'Person holding a plank position, side view',
  },
  {
    id: 'jumping-jack',
    name: 'Jumping Jack',
    desc: 'Arm and leg spread detection with automatic rep counting at full speed.',
    gif: '/assets/jumping-jack.gif',
    focus: 'center 40%',
    alt: 'Person performing jumping jacks, front view',
  },
  {
    id: 'bicep-curl',
    name: 'Bicep Curl',
    desc: 'Elbow flexion tracking, swing detection and full range-of-motion counting.',
    gif: '/assets/bicep-curl.gif',
    focus: 'center 45%',
    alt: 'Person performing a standing dumbbell bicep curl, side view',
  },
];

export default function ExerciseDetectorSection() {
  const { darkMode } = useTheme();
  // Push-Up is selected by default (index 1)
  const [activeTab, setActiveTab] = useState(1);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: '0px', width: '0px' });
  const [imgError, setImgError] = useState({});

  const tablistRef = useRef(null);
  const tabRefs = useRef([]);

  // Preload Push-Up GIF on mount
  useEffect(() => {
    const preloadLink = document.createElement('link');
    preloadLink.rel = 'preload';
    preloadLink.as = 'image';
    preloadLink.href = '/assets/push-up.gif';
    document.head.appendChild(preloadLink);

    return () => {
      if (document.head.contains(preloadLink)) {
        document.head.removeChild(preloadLink);
      }
    };
  }, []);

  // Update sliding indicator position
  const updateIndicator = () => {
    const currentTab = tabRefs.current[activeTab];
    if (currentTab) {
      setIndicatorStyle({
        left: `${currentTab.offsetLeft}px`,
        width: `${currentTab.offsetWidth}px`,
      });
    }
  };

  useEffect(() => {
    updateIndicator();

    const handleResize = () => {
      updateIndicator();
    };

    window.addEventListener('resize', handleResize);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(updateIndicator);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [activeTab]);

  // Keyboard navigation for tablist (left / right arrows with wrap-around)
  const handleKeyDown = (e, index) => {
    const total = EXERCISES.length;
    let nextIndex = index;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = (index + 1) % total;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = (index - 1 + total) % total;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = total - 1;
    }

    if (nextIndex !== index) {
      setActiveTab(nextIndex);
      const targetBtn = tabRefs.current[nextIndex];
      if (targetBtn) {
        targetBtn.focus();
        targetBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  };

  const handleTabClick = (index) => {
    setActiveTab(index);
    const targetBtn = tabRefs.current[index];
    if (targetBtn) {
      targetBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  };

  const currentExercise = EXERCISES[activeTab];

  return (
    <section
      id="programs"
      className={`w-full font-['Plus_Jakarta_Sans',sans-serif] leading-relaxed transition-colors duration-200 ${darkMode ? 'bg-[#0F0F0F] text-[#F7F7F7]' : 'bg-[#F7F7F7] text-[#0F0F0F]'
        }`}
    >
      <div className="max-w-[960px] mx-auto px-6 pt-12 pb-24 sm:pt-[72px]">
        {/* 1. Header (centered) */}
        <div className="text-center">
          <h1 className="text-[clamp(2rem,5.2vw,3.5rem)] font-extrabold tracking-[-0.03em] leading-[1.1] m-0 text-center">
            Exercises the System{' '}
            <span className="text-[#3641C9] dark:text-[#8A9CF7]">
              Can Detect
            </span>
          </h1>
          <p
            className={`mt-4 mx-auto max-w-[54ch] text-[1.05rem] leading-[1.6] text-center ${darkMode ? 'text-[#A3A3B0]' : 'text-[#5D5D68]'
              }`}
          >
            Real-time 33-point pose estimation, joint angle measurement, and automatic rep counting for supported workouts.
          </p>
        </div>

        {/* 2. Tabs */}
        <div
          className={`mt-12 border-b relative w-full ${darkMode ? 'border-[#262630]' : 'border-[#E2E4E9]'
            }`}
        >
          <div
            ref={tablistRef}
            className="flex items-center justify-start sm:justify-center gap-2 relative overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Supported Exercises"
          >
            {EXERCISES.map((ex, index) => {
              const isSelected = activeTab === index;
              return (
                <button
                  key={ex.id}
                  ref={(el) => (tabRefs.current[index] = el)}
                  id={`tab-${ex.id}`}
                  role="tab"
                  type="button"
                  aria-selected={isSelected}
                  aria-controls={`panel-${ex.id}`}
                  tabIndex={isSelected ? 0 : -1}
                  className={`bg-transparent border-0 py-3.5 px-5 font-semibold text-[0.98rem] whitespace-nowrap min-h-[48px] inline-flex items-center justify-center transition-colors duration-200 cursor-pointer outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 ${darkMode
                    ? 'focus-visible:outline-[#8A9CF7]'
                    : 'focus-visible:outline-[#3641C9]'
                    } ${isSelected
                      ? darkMode
                        ? 'text-[#F7F7F7]'
                        : 'text-[#0F0F0F]'
                      : darkMode
                        ? 'text-[#A3A3B0] hover:text-[#F7F7F7]'
                        : 'text-[#5D5D68] hover:text-[#0F0F0F]'
                    }`}
                  onClick={() => handleTabClick(index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                >
                  {ex.name}
                </button>
              );
            })}
            <div
              className={`absolute bottom-0 h-[3px] rounded-t-[3px] transition-all duration-300 pointer-events-none z-10 motion-reduce:transition-none ${darkMode ? 'bg-[#8A9CF7]' : 'bg-[#3641C9]'
                }`}
              style={indicatorStyle}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* 3. Panel */}
        <div
          id={`panel-${currentExercise.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${currentExercise.id}`}
          className="mt-10 text-left"
        >
          <div
            key={currentExercise.id}
            className="transition-all duration-350 ease-out"
          >
            <h2
              className={`text-[1.8rem] sm:text-[2.2rem] font-extrabold tracking-[-0.02em] leading-[1.1] m-0 text-left ${darkMode ? 'text-[#8A9CF7]' : 'text-[#3641C9]'
                }`}
            >
              {currentExercise.name}
            </h2>
            <p
              className={`mt-2.5 text-[1.05rem] max-w-[52ch] leading-[1.6] text-left ${darkMode ? 'text-[#A3A3B0]' : 'text-[#5D5D68]'
                }`}
            >
              {currentExercise.desc}
            </p>

            <div
              className={`mt-7 aspect-[4/3] sm:aspect-video rounded-[18px] sm:rounded-[24px] overflow-hidden border shadow-[0_20px_50px_-30px_rgba(0,0,0,0.45)] relative w-full ${darkMode
                ? 'bg-[#16161D] border-[#262630]'
                : 'bg-[#ffffff] border-[#E2E4E9]'
                }`}
            >
              {imgError[currentExercise.id] ? (
                <div
                  className={`w-full h-full flex items-center justify-center font-semibold text-xl ${darkMode
                    ? 'bg-[#16161D] text-[#A3A3B0]'
                    : 'bg-[#ffffff] text-[#5D5D68]'
                    }`}
                >
                  <span>{currentExercise.name}</span>
                </div>
              ) : (
                <img
                  key={currentExercise.id}
                  src={currentExercise.gif}
                  alt={currentExercise.alt}
                  style={{
                    objectPosition: currentExercise.focus || 'center center',
                  }}
                  className="w-full h-full object-cover block"
                  loading={activeTab === 1 ? 'eager' : 'lazy'}
                  onError={() =>
                    setImgError((prev) => ({ ...prev, [currentExercise.id]: true }))
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
