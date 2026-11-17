import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';

const safeJsonParse = async (res) => {
  try {
    const text = await res.text();
    if (!text) return {};
    return JSON.parse(text);
  } catch {
    return {};
  }
};

export default function ProfileModal() {
  const { isProfileModalOpen, closeProfileModal, user, token, updateProfile } = useAuth();
  const { darkMode } = useTheme();

  // Mode: read-only by default
  const [isEditing, setIsEditing] = useState(false);

  // Form input state
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState('Male');

  // Backup of saved values for Cancel restoration
  const [savedValues, setSavedValues] = useState({
    age: '',
    weight: '',
    height: '',
    gender: 'Male',
  });

  // Validation & Error states
  const [errorMsg, setErrorMsg] = useState('');
  const [invalidField, setInvalidField] = useState(null); // 'age' | 'weight' | 'height' | 'gender'

  // Loading & Saving states
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileLoadError, setProfileLoadError] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  // Workout History data
  const [historySummary, setHistorySummary] = useState({ workouts: 0, minutes: 0, kcal: 0 });
  const [historyDays, setHistoryDays] = useState([]);
  const [allWorkouts, setAllWorkouts] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  // Monthly Activity Grid & Day Popup state
  const [selectedMonthDate, setSelectedMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [activePopupDay, setActivePopupDay] = useState(null);

  // References for focusing invalid inputs
  const ageInputRef = useRef(null);
  const weightInputRef = useRef(null);
  const heightInputRef = useRef(null);
  const modalRef = useRef(null);

  // Populate or refresh profile data from DB
  const loadProfileFromDB = async () => {
    if (!token) return;
    setIsLoadingProfile(true);
    setProfileLoadError(null);
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await safeJsonParse(res);
      if (!res.ok) {
        throw new Error(data.detail || 'Could not load profile from database.');
      }
      const loaded = {
        age: data.age != null ? String(data.age) : '21',
        weight: data.weight != null ? String(data.weight) : '55',
        height: data.height != null ? String(data.height) : '160',
        gender: data.sex ? (data.sex.charAt(0).toUpperCase() + data.sex.slice(1).toLowerCase()) : 'Male',
      };
      setAge(loaded.age);
      setWeight(loaded.weight);
      setHeight(loaded.height);
      setGender(loaded.gender);
      setSavedValues(loaded);
    } catch (err) {
      setProfileLoadError(err.message || 'Failed to load profile');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Load Workout History from DB
  const loadHistoryFromDB = async () => {
    if (!token) return;
    setIsLoadingHistory(true);
    setHistoryError(null);
    try {
      const res = await fetch('/api/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await safeJsonParse(res);
      if (!res.ok) {
        throw new Error(data.detail || 'Could not load workout history.');
      }
      setHistorySummary(data.summary || { workouts: 0, minutes: 0, kcal: 0 });
      setHistoryDays(data.days || []);
      setAllWorkouts(data.workouts || []);
    } catch (err) {
      setHistoryError(err.message || 'Failed to load workout history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Trigger loads when modal opens
  useEffect(() => {
    if (isProfileModalOpen) {
      setIsEditing(false);
      setErrorMsg('');
      setInvalidField(null);
      setActivePopupDay(null);
      setToastMsg('');
      const now = new Date();
      setSelectedMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
      loadProfileFromDB();
      loadHistoryFromDB();
    }
  }, [isProfileModalOpen, token]);

  // Handle ESC key to close modal & reset
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isProfileModalOpen) return;
      if (e.key === 'Escape') {
        if (activePopupDay) {
          setActivePopupDay(null);
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProfileModalOpen, activePopupDay]);

  const handleClose = () => {
    // Discard unsaved changes, clear errors, reset to read-only
    setAge(savedValues.age);
    setWeight(savedValues.weight);
    setHeight(savedValues.height);
    setGender(savedValues.gender);
    setIsEditing(false);
    setErrorMsg('');
    setInvalidField(null);
    setActivePopupDay(null);
    closeProfileModal();
  };

  const handleCancel = () => {
    // Restores saved values, clears any error, returns to read-only mode with modal open
    setAge(savedValues.age);
    setWeight(savedValues.weight);
    setHeight(savedValues.height);
    setGender(savedValues.gender);
    setErrorMsg('');
    setInvalidField(null);
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setErrorMsg('');
    setInvalidField(null);
    setTimeout(() => {
      ageInputRef.current?.focus();
    }, 50);
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setErrorMsg('');
    setInvalidField(null);

    // Validation 1: Age (required, whole number, 10 to 100)
    const rawAge = age.trim();
    if (!rawAge || !/^\d+$/.test(rawAge)) {
      setErrorMsg('Enter an age between 10 and 100.');
      setInvalidField('age');
      ageInputRef.current?.focus();
      return;
    }
    const numAge = parseInt(rawAge, 10);
    if (numAge < 10 || numAge > 100) {
      setErrorMsg('Enter an age between 10 and 100.');
      setInvalidField('age');
      ageInputRef.current?.focus();
      return;
    }

    // Validation 2: Weight (required, number, 20 to 300, decimals allowed)
    const rawWeight = weight.trim();
    if (!rawWeight || !/^\d+(\.\d+)?$/.test(rawWeight)) {
      setErrorMsg('Enter a weight between 20 and 300 kg.');
      setInvalidField('weight');
      weightInputRef.current?.focus();
      return;
    }
    const numWeight = parseFloat(rawWeight);
    if (isNaN(numWeight) || numWeight < 20 || numWeight > 300) {
      setErrorMsg('Enter a weight between 20 and 300 kg.');
      setInvalidField('weight');
      weightInputRef.current?.focus();
      return;
    }

    // Validation 3: Height (required, whole number, 100 to 250)
    const rawHeight = height.trim();
    if (!rawHeight || !/^\d+$/.test(rawHeight)) {
      setErrorMsg('Enter a height between 100 and 250 cm.');
      setInvalidField('height');
      heightInputRef.current?.focus();
      return;
    }
    const numHeight = parseInt(rawHeight, 10);
    if (numHeight < 100 || numHeight > 250) {
      setErrorMsg('Enter a height between 100 and 250 cm.');
      setInvalidField('height');
      heightInputRef.current?.focus();
      return;
    }

    // Validation 4: Gender (exactly one of Male, Female, Other)
    if (!['Male', 'Female', 'Other'].includes(gender)) {
      setErrorMsg('Select gender: Male, Female, or Other.');
      setInvalidField('gender');
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateProfile({
        name: user?.name || user?.username,
        age: numAge,
        weight: numWeight,
        height: numHeight,
        sex: gender,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to save changes. Please try again.');
        // Stay in edit mode on failure
      } else {
        const newSaved = {
          age: String(numAge),
          weight: String(numWeight),
          height: String(numHeight),
          gender,
        };
        setSavedValues(newSaved);
        setIsEditing(false);
        setToastMsg('Profile saved');
        setTimeout(() => setToastMsg(''), 3000);
      }
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentYear = selectedMonthDate.getFullYear();
  const currentMonth = selectedMonthDate.getMonth(); // 0-indexed

  const monthTitle = selectedMonthDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Month workouts from allWorkouts
  const monthWorkouts = useMemo(() => {
    return (allWorkouts || []).filter((w) => {
      if (!w.date) return false;
      const [y, m] = w.date.split('-').map(Number);
      return y === currentYear && m - 1 === currentMonth;
    });
  }, [allWorkouts, currentYear, currentMonth]);

  // Group by day of month (1..31)
  const workoutsByDayNum = useMemo(() => {
    const map = {};
    for (const w of monthWorkouts) {
      const day = parseInt(w.date.split('-')[2], 10);
      if (!map[day]) map[day] = [];
      map[day].push(w);
    }
    return map;
  }, [monthWorkouts]);

  // Active days & total kcal this month
  const activeDaysCount = Object.keys(workoutsByDayNum).length;
  const monthKcal = Math.round(
    monthWorkouts.reduce((acc, w) => acc + (Number(w.calories_burned) || 0), 0)
  );

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun .. 6 = Sat
  const totalWeeks = Math.ceil((firstDayOfWeek + daysInMonth) / 7);

  const today = new Date();
  const isTodayDate = (d) =>
    today.getFullYear() === currentYear &&
    today.getMonth() === currentMonth &&
    today.getDate() === d;

  const isFutureDate = (d) => {
    const checkDate = new Date(currentYear, currentMonth, d);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return checkDate > todayStart;
  };

  const isCurrentMonth =
    selectedMonthDate.getFullYear() === today.getFullYear() &&
    selectedMonthDate.getMonth() === today.getMonth();

  const handlePrevMonth = () => {
    setSelectedMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    if (isCurrentMonth) return;
    setSelectedMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSquareClick = (dayNum, workouts) => {
    const dateObj = new Date(currentYear, currentMonth, dayNum);
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    setActivePopupDay({
      dayNum,
      dateObj,
      dateStr,
      workouts,
    });
  };

  const displayName = user?.name || user?.username || 'James Clarell';
  const displayUsername = user?.username || 'james';
  const initial = (displayName.charAt(0) || 'J').toUpperCase();

  if (!isProfileModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={modalRef}
        className={`relative w-full max-w-[820px] rounded-[32px] border p-7 sm:p-9 shadow-2xl transition-all duration-200 overflow-hidden ${
          darkMode
            ? 'bg-[#131316] border-[#26262c] text-[#f4f4f5]'
            : 'bg-white border-neutral-200 text-[#16161a]'
        }`}
      >
        {/* Toast Alert */}
        {toastMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-emerald-600 text-white text-xs sm:text-sm font-semibold shadow-lg z-30 animate-in fade-in slide-in-from-top-1">
            {toastMsg}
          </div>
        )}

        {/* Close Button top-right */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-7 right-7 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors p-1.5 rounded-xl"
          title="Close"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* User Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#ea580c] text-white flex items-center justify-center font-bold text-xl sm:text-2xl shadow-sm shrink-0">
            {initial}
          </div>
          <div>
            <h2 className="font-bold text-xl sm:text-2xl text-[#16161a] dark:text-white leading-tight">
              {displayName}
            </h2>
            <p className="text-sm text-neutral-400 font-medium mt-0.5">
              @{displayUsername}
            </p>
          </div>
        </div>

        {/* Main 2-Column Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 mt-7">
          {/* Left Column: Biometrics & Gender */}
          <div className="md:col-span-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-2.5">
                Biometrics
              </h3>

              {/* Biometrics 3-Row Card */}
              <div
                className={`rounded-2xl border overflow-hidden ${
                  darkMode ? 'bg-[#1a1a1f] border-[#26262c]' : 'bg-neutral-50/80 border-neutral-200'
                }`}
              >
                {/* Age Row */}
                <div
                  className={`flex items-center justify-between px-4 sm:px-5 py-3.5 border-b transition-colors ${
                    darkMode ? 'border-[#26262c]' : 'border-neutral-200/80'
                  } ${
                    invalidField === 'age'
                      ? 'bg-red-500/10'
                      : isEditing && invalidField === null
                      ? 'focus-within:bg-orange-50/50 dark:focus-within:bg-orange-500/5'
                      : ''
                  }`}
                >
                  <span className="text-sm text-neutral-600 dark:text-neutral-300 font-medium">Age</span>
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        ref={ageInputRef}
                        type="text"
                        inputMode="numeric"
                        value={age}
                        onChange={(e) => {
                          setAge(e.target.value);
                          if (invalidField === 'age') {
                            setInvalidField(null);
                            setErrorMsg('');
                          }
                        }}
                        className={`w-16 text-right text-sm sm:text-base font-semibold bg-transparent focus:outline-none ${
                          invalidField === 'age'
                            ? 'text-red-500 font-bold'
                            : 'text-[#16161a] dark:text-white'
                        }`}
                        placeholder="21"
                      />
                      <span className="text-sm text-neutral-400">yrs</span>
                    </div>
                  ) : (
                    <span className="text-sm sm:text-base font-semibold text-[#16161a] dark:text-white">
                      {age || '—'} <span className="text-neutral-400 font-normal text-sm">yrs</span>
                    </span>
                  )}
                </div>

                {/* Weight Row */}
                <div
                  className={`flex items-center justify-between px-4 sm:px-5 py-3.5 border-b transition-colors ${
                    darkMode ? 'border-[#26262c]' : 'border-neutral-200/80'
                  } ${
                    invalidField === 'weight'
                      ? 'bg-red-500/10'
                      : isEditing
                      ? 'bg-[#ffedd5]/50 dark:bg-orange-500/10'
                      : ''
                  }`}
                >
                  <span className="text-sm text-neutral-600 dark:text-neutral-300 font-medium">Weight</span>
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        ref={weightInputRef}
                        type="text"
                        inputMode="decimal"
                        value={weight}
                        onChange={(e) => {
                          setWeight(e.target.value);
                          if (invalidField === 'weight') {
                            setInvalidField(null);
                            setErrorMsg('');
                          }
                        }}
                        className={`w-16 text-right text-sm sm:text-base font-semibold bg-transparent focus:outline-none ${
                          invalidField === 'weight'
                            ? 'text-red-500 font-bold'
                            : isEditing
                            ? 'text-[#ea580c] font-bold'
                            : 'text-[#16161a] dark:text-white'
                        }`}
                        placeholder="55"
                      />
                      <span className="text-sm text-neutral-400">kg</span>
                    </div>
                  ) : (
                    <span className="text-sm sm:text-base font-semibold text-[#16161a] dark:text-white">
                      {weight || '—'} <span className="text-neutral-400 font-normal text-sm">kg</span>
                    </span>
                  )}
                </div>

                {/* Height Row */}
                <div
                  className={`flex items-center justify-between px-4 sm:px-5 py-3.5 transition-colors ${
                    invalidField === 'height'
                      ? 'bg-red-500/10'
                      : isEditing && invalidField === null
                      ? 'focus-within:bg-orange-50/50 dark:focus-within:bg-orange-500/5'
                      : ''
                  }`}
                >
                  <span className="text-sm text-neutral-600 dark:text-neutral-300 font-medium">Height</span>
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        ref={heightInputRef}
                        type="text"
                        inputMode="numeric"
                        value={height}
                        onChange={(e) => {
                          setHeight(e.target.value);
                          if (invalidField === 'height') {
                            setInvalidField(null);
                            setErrorMsg('');
                          }
                        }}
                        className={`w-16 text-right text-sm sm:text-base font-semibold bg-transparent focus:outline-none ${
                          invalidField === 'height'
                            ? 'text-red-500 font-bold'
                            : 'text-[#16161a] dark:text-white'
                        }`}
                        placeholder="160"
                      />
                      <span className="text-sm text-neutral-400">cm</span>
                    </div>
                  ) : (
                    <span className="text-sm sm:text-base font-semibold text-[#16161a] dark:text-white">
                      {height || '—'} <span className="text-neutral-400 font-normal text-sm">cm</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Gender Section */}
              <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mt-5 mb-2.5">
                Gender
              </h3>
              <div
                className={`p-1.5 rounded-2xl border flex items-center gap-1.5 ${
                  darkMode ? 'bg-[#1a1a1f] border-[#26262c]' : 'bg-neutral-50/80 border-neutral-200'
                }`}
              >
                {['Male', 'Female', 'Other'].map((opt) => {
                  const isSelected = gender.toLowerCase() === opt.toLowerCase();
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={!isEditing}
                      onClick={() => {
                        setGender(opt);
                        if (invalidField === 'gender') {
                          setInvalidField(null);
                          setErrorMsg('');
                        }
                      }}
                      className={`flex-1 py-2.5 sm:py-3 text-center text-sm rounded-xl font-medium transition-all ${
                        isSelected
                          ? darkMode
                            ? 'bg-orange-500/20 text-[#ea580c] dark:text-orange-400 font-semibold shadow-sm'
                            : 'bg-[#ffedd5] text-[#ea580c] font-semibold shadow-sm'
                          : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                      } ${!isEditing ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Error Line (one message at a time in red) */}
              {errorMsg && (
                <div className="mt-3.5 text-sm text-red-500 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {profileLoadError && !errorMsg && (
                <div className="mt-3.5 text-sm text-red-500 font-medium flex items-center justify-between">
                  <span>{profileLoadError}</span>
                  <button
                    type="button"
                    onClick={loadProfileFromDB}
                    className="underline hover:text-red-400 cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 pt-2">
              {isEditing ? (
                <div className="space-y-2.5">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSave}
                    className="w-full bg-[#ea580c] hover:bg-[#c2410c] disabled:opacity-50 text-white font-semibold text-sm sm:text-base rounded-2xl py-3.5 sm:py-4 active:scale-[0.98] transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving changes...</span>
                      </>
                    ) : (
                      <span>Save changes</span>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleCancel}
                    className="w-full text-center text-sm text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white transition-colors py-1 cursor-pointer font-medium"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isLoadingProfile || Boolean(profileLoadError)}
                  onClick={handleStartEdit}
                  className="w-full bg-[#ea580c] hover:bg-[#c2410c] disabled:opacity-50 text-white font-semibold text-sm sm:text-base rounded-2xl py-3.5 sm:py-4 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                >
                  {isLoadingProfile ? 'Loading...' : 'Edit'}
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Workout History (Monthly Activity Grid) */}
          <div className="md:col-span-7 relative flex flex-col min-h-[380px]">
            {/* Header row: title "Workout history" */}
            <div className="flex items-center justify-between mb-2 shrink-0">
              <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                Workout history
              </h3>
            </div>

            {/* Month Navigation Row */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="w-7 h-7 rounded-lg border border-neutral-300 dark:border-neutral-700/80 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800/40 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center transition-all cursor-pointer"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-[#16161a] dark:text-white text-base tracking-tight select-none px-1">
                  {monthTitle}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  disabled={isCurrentMonth}
                  className="w-7 h-7 rounded-lg border border-neutral-300 dark:border-neutral-700/80 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800/40 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* N active days · N kcal this month */}
              <div className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-medium select-none">
                {activeDaysCount} active days · {monthKcal} kcal this month
              </div>
            </div>

            {/* Loading / Error / Grid View */}
            {isLoadingHistory ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2.5 text-neutral-400 text-sm py-16">
                <Loader2 className="w-5 h-5 animate-spin text-[#ea580c]" />
                <span>Loading activity...</span>
              </div>
            ) : historyError ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-sm text-red-500">
                <p>{historyError}</p>
                <button
                  type="button"
                  onClick={loadHistoryFromDB}
                  className="mt-2 text-sm text-[#ea580c] underline hover:text-[#c2410c] cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center">
                {/* 7 rows (Sun to Sat), one column per week, Mon / Wed / Fri labels on left */}
                <div className="flex items-start gap-3 select-none">
                  {/* Day labels column */}
                  <div className="flex flex-col justify-between py-1 h-[270px] sm:h-[300px] text-xs font-semibold text-neutral-500 dark:text-neutral-400 shrink-0">
                    <span className="h-9 sm:h-10 flex items-center"></span>
                    <span className="h-9 sm:h-10 flex items-center">Mon</span>
                    <span className="h-9 sm:h-10 flex items-center"></span>
                    <span className="h-9 sm:h-10 flex items-center">Wed</span>
                    <span className="h-9 sm:h-10 flex items-center"></span>
                    <span className="h-9 sm:h-10 flex items-center">Fri</span>
                    <span className="h-9 sm:h-10 flex items-center"></span>
                  </div>

                  {/* Weeks grid */}
                  <div className="flex items-start gap-2 sm:gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                    {Array.from({ length: totalWeeks }).map((_, col) => (
                      <div key={col} className="flex flex-col gap-2 sm:gap-2.5">
                        {Array.from({ length: 7 }).map((_, row) => {
                          const dayNum = col * 7 + row - firstDayOfWeek + 1;
                          if (dayNum < 1 || dayNum > daysInMonth) {
                            return (
                              <div
                                key={row}
                                className="w-9 h-9 sm:w-11 sm:h-11 invisible pointer-events-none"
                              />
                            );
                          }

                          const dayWorkouts = workoutsByDayNum[dayNum] || [];
                          const count = dayWorkouts.length;
                          const isFut = isFutureDate(dayNum);
                          const isTod = isTodayDate(dayNum);

                          // Shading rules:
                          // 1 = darkest, 2-3, 4-5, 6+ = brightest
                          let bgClass = '';
                          if (count === 0) {
                            bgClass = isFut
                              ? 'border border-neutral-200 dark:border-neutral-800/60 opacity-30 cursor-not-allowed pointer-events-none'
                              : 'border border-neutral-300 dark:border-neutral-700/80 bg-transparent hover:border-neutral-500 cursor-pointer';
                          } else if (count === 1) {
                            bgClass = 'bg-[#8c3d14] border-transparent hover:brightness-110 cursor-pointer text-white';
                          } else if (count >= 2 && count <= 3) {
                            bgClass = 'bg-[#c25419] border-transparent hover:brightness-110 cursor-pointer text-white';
                          } else if (count >= 4 && count <= 5) {
                            bgClass = 'bg-[#e65c19] border-transparent hover:brightness-110 cursor-pointer text-white';
                          } else {
                            bgClass = 'bg-[#ff6a13] border-transparent hover:brightness-110 shadow-[0_0_8px_rgba(255,106,19,0.35)] cursor-pointer text-white';
                          }

                          const ariaLabel = isFut
                            ? `${monthTitle} ${dayNum} (future)`
                            : `${monthTitle} ${dayNum}: ${count} ${count === 1 ? 'workout' : 'workouts'}`;

                          return (
                            <button
                              key={row}
                              type="button"
                              tabIndex={isFut ? -1 : 0}
                              aria-label={ariaLabel}
                              disabled={isFut}
                              onClick={() => !isFut && handleSquareClick(dayNum, dayWorkouts)}
                              className={`group relative w-9 h-9 sm:w-11 sm:h-11 rounded-[8px] sm:rounded-[10px] flex items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${bgClass}`}
                            >
                              {/* Day number shown on hover or focus */}
                              <span
                                className={`opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity text-xs font-bold leading-none select-none ${
                                  count === 0 ? 'text-neutral-800 dark:text-white' : 'text-white'
                                }`}
                              >
                                {dayNum}
                              </span>

                              {/* Today dot indicator */}
                              {isTod && (
                                <span
                                  className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full pointer-events-none ${
                                    count === 0 ? 'bg-neutral-800 dark:bg-white' : 'bg-white'
                                  }`}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Day Detail Popup Modal (Image 2 & 3) */}
        {activePopupDay && (
          <div
            className="absolute inset-0 z-30 flex items-center justify-center bg-white/80 dark:bg-black/75 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-150"
            onClick={() => setActivePopupDay(null)}
          >
            <div
              className="w-full max-w-[420px] bg-white dark:bg-[#16161d] border border-neutral-200 dark:border-neutral-700/70 rounded-2xl p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[92%] text-neutral-900 dark:text-white animate-in zoom-in-95 duration-150 no-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                // Include all recorded workouts for this day, including Auto-detect
                const validWorkouts = (activePopupDay.workouts || []).filter(
                  (w) => Boolean(w.exercise_name)
                );

                const totalKcal = Math.round(
                  validWorkouts.reduce(
                    (sum, w) => sum + (Number(w.calories_burned) || 0),
                    0
                  )
                );

                // Group by exercise in order of first appearance that day
                const groups = [];
                const seen = new Map();
                for (const w of validWorkouts) {
                  let group = seen.get(w.exercise_name);
                  if (!group) {
                    group = { name: w.exercise_name, sets: [] };
                    seen.set(w.exercise_name, group);
                    groups.push(group);
                  }
                  group.sets.push(w);
                }

                return (
                  <>
                    {/* Top Row: Title & Close Button */}
                    <div className="flex items-start justify-between pb-3 shrink-0">
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#16161a] dark:text-white">
                          {activePopupDay.dateObj.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </h3>
                        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 lowercase mt-0.5 font-medium">
                          {activePopupDay.dateObj.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                          })} · {validWorkouts.length} {validWorkouts.length === 1 ? 'workout' : 'workouts'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActivePopupDay(null)}
                        className="w-8 h-8 rounded-full border border-orange-500/40 hover:border-orange-500 flex items-center justify-center text-orange-500 transition-all cursor-pointer shrink-0"
                        title="Close"
                        aria-label="Close day details"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Workout Groups */}
                    <div className="py-2 space-y-4">
                      {validWorkouts.length === 0 ? (
                        <div className="py-10 text-center text-neutral-500 dark:text-neutral-400 text-sm sm:text-base font-medium">
                          No workout on this day.
                        </div>
                      ) : (
                        <>
                          {groups.map((group, gIdx) => (
                            <div key={group.name} className="space-y-2">
                              {/* Exercise Heading */}
                              <h4 className="text-[17px] sm:text-[18px] font-bold text-[#16161a] dark:text-white tracking-tight">
                                {group.name}
                              </h4>

                              {/* Sets Rows */}
                              <div className="space-y-1.5">
                                {group.sets.map((set, setIdx) => {
                                  const isPlank = group.name.toLowerCase().includes('plank');
                                  const isCurl = group.name.toLowerCase().includes('curl');
                                  let amountStr = '';
                                  if (isPlank) {
                                    amountStr = `${set.duration_seconds || 0} sec`;
                                  } else if (set.reps != null && Number(set.reps) > 0) {
                                    amountStr = `${set.reps} reps`;
                                  } else if (set.duration_seconds != null && Number(set.duration_seconds) > 0) {
                                    amountStr = `${set.duration_seconds} sec`;
                                  } else {
                                    amountStr = '0 reps';
                                  }

                                  let weightStr = '';
                                  if (set.weight_lbs != null && Number(set.weight_lbs) > 0) {
                                    const kg = Math.round(Number(set.weight_lbs) * 0.453592);
                                    weightStr = `${kg || Math.round(Number(set.weight_lbs))} kg`;
                                  }

                                  return (
                                    <div
                                      key={set.id || setIdx}
                                      className="grid grid-cols-[65px_65px_1fr_65px] items-center text-sm sm:text-base"
                                    >
                                      <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                                        Set {setIdx + 1}
                                      </span>
                                      <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                                        {weightStr}
                                      </span>
                                      <span className="text-right text-[#16161a] dark:text-white font-bold pr-3">
                                        {amountStr}
                                      </span>
                                      <span className="text-right text-[#ea580c] font-bold">
                                        {Math.round(Number(set.calories_burned) || 0)} kcal
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Thin divider between exercise groups */}
                              {gIdx < groups.length - 1 && (
                                <div className="border-b border-neutral-200 dark:border-neutral-800/80 pt-3" />
                              )}
                            </div>
                          ))}

                          {/* Footer line: Total and the day's total kcal */}
                          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800/80 flex items-center justify-between text-base sm:text-lg">
                            <span className="text-neutral-500 dark:text-neutral-400 font-medium">Total</span>
                            <span className="text-[#16161a] dark:text-white font-bold">{totalKcal} kcal</span>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

