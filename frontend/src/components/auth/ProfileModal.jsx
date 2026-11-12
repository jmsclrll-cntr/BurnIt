import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
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
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  // Selected workout for detail popup
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  // Day Popup state
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayDetails, setDayDetails] = useState(null);
  const [isLoadingDay, setIsLoadingDay] = useState(false);
  const [dayError, setDayError] = useState(null);

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
    } catch (err) {
      setHistoryError(err.message || 'Failed to load workout history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load Day Details when day row clicked
  const handleDayClick = async (day) => {
    setSelectedDay(day);
    setDayDetails(null);
    setDayError(null);
    setIsLoadingDay(true);

    try {
      const res = await fetch(`/api/history/day/${day.date}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await safeJsonParse(res);
      if (!res.ok) {
        throw new Error(data.detail || 'Could not load details for this day.');
      }
      setDayDetails(data);
    } catch (err) {
      setDayError(err.message || 'Failed to load day details');
    } finally {
      setIsLoadingDay(false);
    }
  };

  const handleWorkoutClick = (workout, day) => {
    setSelectedWorkout({
      ...workout,
      dayTitle: day?.title || 'Today',
      daySubtitle: day?.subtitle || '',
    });
  };

  // Trigger loads when modal opens
  useEffect(() => {
    if (isProfileModalOpen) {
      setIsEditing(false);
      setErrorMsg('');
      setInvalidField(null);
      setSelectedDay(null);
      setSelectedWorkout(null);
      setToastMsg('');
      loadProfileFromDB();
      loadHistoryFromDB();
    }
  }, [isProfileModalOpen, token]);

  // Handle ESC key to close modal & reset
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isProfileModalOpen) return;
      if (e.key === 'Escape') {
        if (selectedWorkout) {
          setSelectedWorkout(null);
        } else if (selectedDay) {
          setSelectedDay(null);
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProfileModalOpen, selectedDay, selectedWorkout]);

  if (!isProfileModalOpen) return null;

  const handleClose = () => {
    // Discard unsaved changes, clear errors, reset to read-only
    setAge(savedValues.age);
    setWeight(savedValues.weight);
    setHeight(savedValues.height);
    setGender(savedValues.gender);
    setIsEditing(false);
    setErrorMsg('');
    setInvalidField(null);
    setSelectedDay(null);
    setSelectedWorkout(null);
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

  const displayName = user?.name || user?.username || 'James Clarell';
  const displayUsername = user?.username || 'james';
  const initial = (displayName.charAt(0) || 'J').toUpperCase();

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={modalRef}
        className={`relative w-full max-w-[820px] rounded-[32px] border p-7 sm:p-9 shadow-2xl transition-all duration-200 ${
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

          {/* Right Column: Workout History */}
          <div className="md:col-span-7 relative flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                Workout history
              </h3>
              {historySummary.workouts > 0 && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-500/10 text-[#ea580c]">
                  {historySummary.workouts} {historySummary.workouts === 1 ? 'workout' : 'workouts'}
                </span>
              )}
            </div>

            {/* Days & Workouts List (Newest First, Each Workout Visible to Click) */}
            <div className="relative flex-1 min-h-[340px] flex flex-col">
              {isLoadingHistory ? (
                <div className="py-14 flex flex-col items-center justify-center gap-2.5 text-neutral-400 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-[#ea580c]" />
                  <span>Loading history...</span>
                </div>
              ) : historyError ? (
                <div className="py-12 text-center text-sm text-red-500">
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
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] no-scrollbar pr-0.5">
                  {historyDays && historyDays.length > 0 ? (
                    historyDays.map((day) => (
                      <div key={day.date} className="space-y-1.5 mb-3 last:mb-0">
                        {/* Day Group Header */}
                        <div className="flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                          <span>{day.title}</span>
                          <span className="text-[11px] font-normal lowercase text-neutral-400">
                            {day.subtitle}
                          </span>
                        </div>

                        {/* Each Workout Item: Visible & Clickable */}
                        <div className="space-y-1.5">
                          {day.items && day.items.length > 0 ? (
                            day.items.map((workout) => (
                              <div
                                key={workout.id}
                                onClick={() => handleWorkoutClick(workout, day)}
                                className={`flex items-center justify-between py-3 px-3.5 rounded-2xl transition-all cursor-pointer border ${
                                  darkMode
                                    ? 'bg-[#1a1a1f] hover:bg-[#22222a] hover:border-orange-500/50 border-[#26262c] text-white'
                                    : 'bg-neutral-50/90 hover:bg-white hover:border-orange-500/50 border-neutral-200 text-neutral-900 shadow-sm'
                                }`}
                              >
                                <div className="min-w-0 pr-3">
                                  <div className="font-bold text-sm sm:text-base text-[#16161a] dark:text-white truncate">
                                    {workout.exercise_name}
                                  </div>
                                  <div className="text-xs text-neutral-400 mt-0.5 truncate">
                                    {workout.start_time ? `${workout.start_time} · ` : ''}{workout.reps} reps
                                  </div>
                                </div>

                                <div className="flex items-center gap-3.5 sm:gap-4 shrink-0">
                                  <span className="text-sm font-semibold text-[#16161a] dark:text-white font-mono">
                                    {workout.duration_formatted}
                                  </span>
                                  <span className="text-sm font-bold text-[#ea580c] font-mono">
                                    {workout.calories_burned} kcal
                                  </span>
                                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                                </div>
                              </div>
                            ))
                          ) : (
                            <div
                              onClick={() => handleDayClick(day)}
                              className={`flex items-center justify-between py-3 px-3.5 rounded-2xl transition-all cursor-pointer border ${
                                darkMode
                                  ? 'bg-[#1a1a1f] hover:bg-[#22222a] border-[#26262c] text-white'
                                  : 'bg-neutral-50/90 hover:bg-white border-neutral-200 text-neutral-900'
                              }`}
                            >
                              <div>
                                <div className="font-bold text-sm sm:text-base text-[#16161a] dark:text-white">
                                  {day.title}
                                </div>
                                <div className="text-xs text-neutral-400 mt-0.5">
                                  {day.subtitle}
                                </div>
                              </div>
                              <div className="flex items-center gap-3.5">
                                <span className="text-sm font-semibold text-[#16161a] dark:text-white">
                                  {day.minutes} min
                                </span>
                                <span className="text-sm font-bold text-[#ea580c]">
                                  {day.kcal} kcal
                                </span>
                                <ChevronRight className="w-4 h-4 text-neutral-400" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center text-sm text-neutral-400 font-medium">
                      No workout history recorded yet.
                    </div>
                  )}
                </div>
              )}

              {/* Workout Details Popup Overlay (When an individual workout is clicked) */}
              {selectedWorkout && (
                <div
                  className={`absolute inset-0 z-20 rounded-2xl border p-5 sm:p-6 shadow-2xl flex flex-col justify-between overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
                    darkMode
                      ? 'bg-[#181826] border-[#26262c] text-white shadow-black/80'
                      : 'bg-white border-neutral-200 text-neutral-900 shadow-xl'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between pb-3.5 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
                      <div>
                        <div className="inline-block px-2.5 py-0.5 rounded-full bg-orange-500/10 text-[#ea580c] font-semibold text-xs mb-1.5">
                          Workout details
                        </div>
                        <h4 className="font-bold text-xl sm:text-2xl text-[#16161a] dark:text-white">
                          {selectedWorkout.exercise_name}
                        </h4>
                        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {selectedWorkout.dayTitle} · {selectedWorkout.start_time || selectedWorkout.date}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedWorkout(null)}
                        className="w-8 h-8 rounded-full border-2 border-[#ea580c] text-neutral-600 dark:text-neutral-300 flex items-center justify-center hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors cursor-pointer shrink-0"
                        title="Close details"
                      >
                        <X className="w-4 h-4 text-[#ea580c]" />
                      </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="py-4 grid grid-cols-2 gap-3 shrink-0">
                      <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-[#131316] border-[#26262c]' : 'bg-neutral-50 border-neutral-200'}`}>
                        <div className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Duration</div>
                        <div className="text-xl sm:text-2xl font-bold font-mono text-[#16161a] dark:text-white mt-1">
                          {selectedWorkout.duration_formatted}
                        </div>
                      </div>

                      <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-[#131316] border-[#26262c]' : 'bg-neutral-50 border-neutral-200'}`}>
                        <div className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Calories</div>
                        <div className="text-xl sm:text-2xl font-bold font-mono text-[#ea580c] mt-1">
                          {selectedWorkout.calories_burned} <span className="text-xs font-normal text-neutral-400">kcal</span>
                        </div>
                      </div>

                      <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-[#131316] border-[#26262c]' : 'bg-neutral-50 border-neutral-200'}`}>
                        <div className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Reps</div>
                        <div className="text-xl sm:text-2xl font-bold font-mono text-[#16161a] dark:text-white mt-1">
                          {selectedWorkout.reps} <span className="text-xs font-normal text-neutral-400">reps</span>
                        </div>
                      </div>

                      <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-[#131316] border-[#26262c]' : 'bg-neutral-50 border-neutral-200'}`}>
                        <div className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Status</div>
                        <div className="text-base sm:text-lg font-bold text-emerald-500 mt-1">
                          Completed
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Done / Close Button */}
                  <div className="pt-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedWorkout(null)}
                      className="w-full bg-[#ea580c] hover:bg-[#c2410c] text-white font-semibold text-sm rounded-xl py-3 transition-all cursor-pointer shadow-sm text-center"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}

              {/* Day Popup Overlay (When a day is clicked) */}
              {selectedDay && !selectedWorkout && (
                <div
                  className={`absolute inset-0 z-20 rounded-2xl border p-5 sm:p-6 shadow-2xl flex flex-col justify-between overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
                    darkMode
                      ? 'bg-[#181826] border-[#26262c] text-white shadow-black/80'
                      : 'bg-white border-neutral-200 text-neutral-900 shadow-xl'
                  }`}
                >
                  <div>
                    {/* Day Popup Header */}
                    <div className="flex items-start justify-between pb-3.5 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
                      <div>
                        <h4 className="font-bold text-lg sm:text-xl text-[#16161a] dark:text-white">
                          {dayDetails?.title || selectedDay.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {dayDetails?.subtitle || selectedDay.subtitle}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedDay(null)}
                        className="w-8 h-8 rounded-full border-2 border-[#ea580c] text-neutral-600 dark:text-neutral-300 flex items-center justify-center hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors cursor-pointer shrink-0"
                        title="Close day popup"
                      >
                        <X className="w-4 h-4 text-[#ea580c]" />
                      </button>
                    </div>

                    {/* Workouts in this day */}
                    <div className="flex-1 min-h-0 overflow-y-auto py-2.5 space-y-2 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                      {isLoadingDay ? (
                        <div className="py-10 flex flex-col items-center justify-center gap-2 text-neutral-400 text-sm">
                          <Loader2 className="w-5 h-5 animate-spin text-[#ea580c]" />
                          <span>Loading workouts...</span>
                        </div>
                      ) : dayError ? (
                        <div className="py-8 text-center text-sm text-red-500">
                          <p>{dayError}</p>
                          <button
                            type="button"
                            onClick={() => handleDayClick(selectedDay)}
                            className="mt-2 text-sm text-[#ea580c] underline"
                          >
                            Retry
                          </button>
                        </div>
                      ) : dayDetails?.items && dayDetails.items.length > 0 ? (
                        dayDetails.items.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            onClick={() => handleWorkoutClick(item, selectedDay)}
                            className={`flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-white/5 cursor-pointer ${
                              idx > 0 ? 'border-t border-neutral-100 dark:border-white/5' : ''
                            }`}
                          >
                            <div className="min-w-0 pr-3">
                              <div className="font-bold text-sm sm:text-base text-[#16161a] dark:text-white truncate">
                                {item.exercise_name}
                              </div>
                              <div className="text-xs text-neutral-400 mt-0.5 truncate">
                                {item.start_time} · {item.reps} reps
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-right shrink-0">
                              <div>
                                <div className="text-sm sm:text-base font-bold font-mono text-[#16161a] dark:text-white">
                                  {item.duration_formatted}
                                </div>
                                <div className="text-[11px] text-neutral-400 lowercase">
                                  duration
                                </div>
                              </div>
                              <div>
                                <div className="text-sm sm:text-base font-bold font-mono text-[#ea580c]">
                                  {item.calories_burned}
                                </div>
                                <div className="text-[11px] text-neutral-400 lowercase">
                                  kcal
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-10 text-center text-sm text-neutral-400">
                          Rest day — No workouts recorded.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

