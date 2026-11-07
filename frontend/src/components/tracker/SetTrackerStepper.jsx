import React from 'react';
import { EXERCISE_INFO } from '../../lib/mediapipeTracker';

/**
 * Format seconds as mm:ss
 */
function formatMMSS(totalSeconds) {
  const secs = Math.max(0, Math.floor(totalSeconds || 0));
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * SetTrackerStepper Component (Rendered at the bottom of the tracker)
 * 
 * Vertical Stepper UI grouped by exercise:
 * - Group sets under an exercise heading with clean spacing.
 * - Numbered circle on left with vertical connecting line to next set.
 * - Summary line: "[reps] reps · mm:ss"
 * - Rest pill under summary: "Rest mm:ss" (counts up live for most recent finished set).
 * - Active set has distinct pulsing live circle, live indicator, and no line below it.
 * - Pure black / high-contrast bold typography in light mode for 100% visibility.
 */
export default function SetTrackerStepper({
  exerciseGroups = {},
  activeSet = null,
  currentExercise = 'squat',
  now = 0,
  onEndSet,
}) {
  // Determine which exercise groups to display
  const allExerciseKeys = Array.from(
    new Set([...Object.keys(exerciseGroups), currentExercise].filter((k) => k && k !== 'auto'))
  );

  return (
    <div className="space-y-6">
      {allExerciseKeys.length === 0 ? (
        <div className="p-5 rounded-xl border border-dashed border-neutral-400 dark:border-white/10 text-center">
          <p className="text-xs text-black dark:text-neutral-300 font-medium">
            Perform your first rep to start <strong className="text-orange-600 dark:text-orange-500 font-bold">Set 1</strong>
          </p>
        </div>
      ) : (
        allExerciseKeys.map((exKey) => {
          const info = EXERCISE_INFO[exKey] || { name: exKey.toUpperCase() };
          const finishedSets = exerciseGroups[exKey] || [];
          const isCurrentExercise = currentExercise === exKey;
          const currentActive = isCurrentExercise ? activeSet : null;
          const isPlank = exKey === 'plank';

          // Combine finished sets + active set into a single list
          const rows = [...finishedSets];
          if (currentActive) {
            const liveDuration = Math.max(0, Math.floor((now - currentActive.startTime) / 1000));
            rows.push({
              setNumber: currentActive.setNumber,
              exercise: exKey,
              reps: currentActive.currentReps,
              startTime: currentActive.startTime,
              duration: liveDuration,
              isLive: true,
            });
          }

          // If no sets yet for this exercise, show a ready placeholder row
          if (rows.length === 0) {
            return (
              <div key={exKey} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
                    {info.name}
                  </h4>
                  <span className="text-[11px] font-mono font-bold text-neutral-800 dark:text-neutral-400">0 sets</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border border-dashed border-neutral-600 dark:border-neutral-700 flex items-center justify-center text-[10px] text-black dark:text-neutral-400 font-mono font-bold">
                    1
                  </div>
                  <span className="text-xs text-neutral-800 dark:text-neutral-400 italic font-medium">
                    Ready for 1st rep...
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div key={exKey} className="space-y-3">
              {/* Exercise Heading with clear spacing */}
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
                  <span>{info.name}</span>
                  {isCurrentExercise && (
                    <span className="w-2 h-2 rounded-full bg-orange-600 dark:bg-orange-500 animate-pulse" />
                  )}
                </h4>
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-700 dark:text-orange-400">
                  {finishedSets.length} {finishedSets.length === 1 ? 'set' : 'sets'}
                </span>
              </div>

              {/* Vertical Stepper List */}
              <div className="space-y-0">
                {rows.map((set, idx) => {
                  const isLive = Boolean(set.isLive);
                  const isLastRow = idx === rows.length - 1;
                  // Connector line runs down to the next circle (no line below active set)
                  const showConnectorLine = !isLastRow;

                  // Derive rest time mathematically using timestamps
                  let restSeconds = 0;
                  let isLiveRest = false;

                  if (!isLive) {
                    const nextSet = rows[idx + 1];
                    if (nextSet) {
                      restSeconds = Math.max(0, Math.floor((nextSet.startTime - set.endTime) / 1000));
                    } else {
                      // Most recent finished set: rest counts up live until next set starts!
                      restSeconds = Math.max(0, Math.floor((now - set.endTime) / 1000));
                      isLiveRest = isCurrentExercise;
                    }
                  }

                  return (
                    <div key={set.setNumber} className="flex gap-3 relative">
                      {/* Left Stepper Rail: Circle + Vertical Connecting Line */}
                      <div className="flex flex-col items-center">
                        {/* Numbered Circle */}
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all flex-shrink-0 ${
                            isLive
                              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30 ring-4 ring-orange-500/20 animate-pulse'
                              : 'bg-neutral-300 dark:bg-white/10 text-black dark:text-neutral-200'
                          }`}
                        >
                          {set.setNumber}
                        </div>

                        {/* Thin vertical connector line running down to next set's circle */}
                        {showConnectorLine && (
                          <div className="w-0.5 bg-neutral-400 dark:bg-white/10 flex-1 my-1 min-h-[18px]" />
                        )}
                      </div>

                      {/* Right Set Details */}
                      <div className={`flex-1 ${showConnectorLine ? 'pb-3.5' : 'pb-1'}`}>
                        {/* Summary Line: "10 reps · 00:42" */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-mono font-bold ${
                              isLive
                                ? 'text-orange-600 dark:text-orange-400'
                                : 'text-black dark:text-neutral-100'
                            }`}
                          >
                            {isPlank ? `${set.reps}s hold` : `${set.reps} reps`} · {formatMMSS(set.duration)}
                          </span>

                          {/* Live Indicator next to active set summary */}
                          {isLive && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-600 dark:bg-orange-500 animate-ping" />
                              Live
                            </span>
                          )}
                        </div>

                        {/* Rest Pill: "Rest 00:30" (Only on finished sets) */}
                        {!isLive && (
                          <div className="mt-1">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono border ${
                                isLiveRest
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-400 font-bold'
                                  : 'bg-neutral-100 dark:bg-white/5 border-neutral-400 dark:border-white/10 text-black dark:text-neutral-300 font-bold'
                              }`}
                            >
                              <span>Rest {formatMMSS(restSeconds)}</span>
                              {isLiveRest && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-500 animate-pulse" />
                              )}
                            </span>
                          </div>
                        )}

                        {/* In-set Action: "End Set" button for active set */}
                        {isLive && onEndSet && (
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              onClick={() => onEndSet()}
                              className="px-3.5 py-1 rounded-full text-[11px] font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-sm transition-all cursor-pointer"
                            >
                              End Set {set.setNumber}
                            </button>
                            <span className="text-[11px] text-neutral-800 dark:text-neutral-400 font-mono font-medium">
                              (Auto-ends after 10s rest)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
