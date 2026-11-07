import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useSetTracker Hook
 * 
 * Manages workout sets and rest intervals grouped by exercise:
 * - The first rep starts a new set (Set 1).
 * - A set ends manually or after 10 seconds of inactivity without a rep.
 * - After a set ends, the counter of current set and reps REMAINS visible
 *   during the rest period while the rest counter counts up live.
 * - When the next set starts (on first rep or manual start), the counter RESETS.
 * - Finished sets record below in the set history with rest intervals.
 * - Timestamps (Date.now()) drive all durations and rest calculations.
 * - Changing the exercise ends any active set and restarts set numbering at 1.
 */
export function useSetTracker({ exercise, repCount, isPaused = false }) {
  // Finished sets grouped by exercise: { [exerciseId]: Array<FinishedSet> }
  const [exerciseGroups, setExerciseGroups] = useState({});

  // Active in-progress set
  // { exercise, setNumber, startRepBaseline, currentReps, startTime, lastRepTime }
  const [activeSet, setActiveSet] = useState(null);

  // Most recent finished set for the current exercise (held during rest period)
  const [lastFinishedSet, setLastFinishedSet] = useState(null);

  // Live timestamp ticker for mm:ss display
  const [now, setNow] = useState(() => Date.now());

  // Refs for change tracking
  const prevExerciseRef = useRef(exercise);
  const prevRepCountRef = useRef(repCount);
  const activeSetRef = useRef(activeSet);
  const lastFinishedSetRef = useRef(lastFinishedSet);

  useEffect(() => {
    activeSetRef.current = activeSet;
  }, [activeSet]);

  useEffect(() => {
    lastFinishedSetRef.current = lastFinishedSet;
  }, [lastFinishedSet]);

  // RequestAnimationFrame ticker for real-time timestamp derivation
  useEffect(() => {
    let animId = null;
    const tick = () => {
      setNow(Date.now());
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  /**
   * Finalize the active set
   */
  const endActiveSet = useCallback((targetActive = activeSetRef.current, endTimestamp = Date.now()) => {
    const currentActive = targetActive || activeSetRef.current;
    if (!currentActive) return;

    const ex = currentActive.exercise;
    const durationSec = Math.max(1, Math.floor((endTimestamp - currentActive.startTime) / 1000));
    const reps = currentActive.currentReps;

    if (reps > 0) {
      const finishedSet = {
        setNumber: currentActive.setNumber,
        exercise: ex,
        reps: reps,
        startTime: currentActive.startTime,
        endTime: endTimestamp,
        duration: durationSec,
      };

      setExerciseGroups((prev) => {
        const currentList = prev[ex] || [];
        return {
          ...prev,
          [ex]: [...currentList, finishedSet],
        };
      });

      // Keep finished set in memory so the sidebar counter REMAINS during rest
      setLastFinishedSet(finishedSet);
    }

    setActiveSet(null);
  }, []);

  /**
   * Start next set manually or upon first rep
   */
  const startNextSet = useCallback(() => {
    if (!exercise || exercise === 'auto') return;

    const existingSets = exerciseGroups[exercise] || [];
    const nextSetNumber = existingSets.length + 1;
    const currentTimestamp = Date.now();
    const currentReps = prevRepCountRef.current || 0;

    setLastFinishedSet(null);
    setActiveSet({
      exercise,
      setNumber: nextSetNumber,
      startRepBaseline: currentReps,
      currentReps: 0,
      startTime: currentTimestamp,
      lastRepTime: currentTimestamp,
    });
  }, [exercise, exerciseGroups]);

  /**
   * Reset all sets (for new session)
   */
  const resetAllSets = useCallback(() => {
    setExerciseGroups({});
    setActiveSet(null);
    setLastFinishedSet(null);
    prevRepCountRef.current = 0;
  }, []);

  /**
   * 1. Detect Exercise Changes:
   * Changing exercise ends any active set and restarts set numbering for the new exercise.
   */
  useEffect(() => {
    const prevEx = prevExerciseRef.current;
    if (prevEx && exercise && prevEx !== exercise) {
      if (activeSetRef.current && activeSetRef.current.currentReps > 0) {
        endActiveSet(activeSetRef.current);
      } else {
        setActiveSet(null);
      }
      setLastFinishedSet(null);
    }
    prevExerciseRef.current = exercise;
  }, [exercise, endActiveSet]);

  /**
   * 2. Hook into rep counter (exercise, repCount):
   * First rep starts a new set; consecutive reps increment active set.
   */
  useEffect(() => {
    if (isPaused || !exercise || exercise === 'auto') return;

    const currentReps = repCount || 0;
    const prevReps = prevRepCountRef.current || 0;
    const currentTimestamp = Date.now();

    if (currentReps > prevReps) {
      const active = activeSetRef.current;

      if (!active) {
        // First rep starts the new set!
        // Clear previous finished set so counter resets for the new set
        setLastFinishedSet(null);

        const existingSets = exerciseGroups[exercise] || [];
        const nextSetNumber = existingSets.length + 1;

        setActiveSet({
          exercise,
          setNumber: nextSetNumber,
          startRepBaseline: prevReps,
          currentReps: currentReps - prevReps,
          startTime: currentTimestamp,
          lastRepTime: currentTimestamp,
        });
      } else {
        // Set already active: update reps and refresh last rep timestamp
        const setReps = currentReps - active.startRepBaseline;
        setActiveSet((prev) => ({
          ...prev,
          currentReps: Math.max(prev.currentReps, setReps),
          lastRepTime: currentTimestamp,
        }));
      }
    }

    prevRepCountRef.current = currentReps;
  }, [repCount, exercise, isPaused, exerciseGroups]);

  /**
   * 3. 10-Second Inactivity Auto-End Check:
   * Automatically ends the active set after 10s without a rep.
   */
  useEffect(() => {
    if (isPaused || !activeSet || activeSet.currentReps === 0) return;

    const timer = setTimeout(() => {
      endActiveSet(activeSet, activeSet.lastRepTime + 1000);
    }, 10000);

    return () => clearTimeout(timer);
  }, [activeSet, isPaused, endActiveSet]);

  // Derived state for the UI
  const isResting = !activeSet && Boolean(lastFinishedSet);
  const currentSetsForExercise = exerciseGroups[exercise] || [];
  
  let currentSetNumber = currentSetsForExercise.length + 1;
  let displayReps = 0;

  if (activeSet) {
    currentSetNumber = activeSet.setNumber;
    displayReps = activeSet.currentReps;
  } else if (lastFinishedSet) {
    // Current set and reps remain visible after set ends during rest!
    currentSetNumber = lastFinishedSet.setNumber;
    displayReps = lastFinishedSet.reps;
  }

  // Rest duration in seconds (derived mathematically from timestamps)
  const restDuration = isResting && lastFinishedSet
    ? Math.max(0, Math.floor((now - lastFinishedSet.endTime) / 1000))
    : 0;

  return {
    exerciseGroups,
    activeSet,
    lastFinishedSet,
    isResting,
    currentSetNumber,
    displayReps,
    restDuration,
    now,
    endActiveSet,
    startNextSet,
    resetAllSets,
  };
}

