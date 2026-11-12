import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, User, Calendar, Scale, Ruler, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';

export default function OnboardingModal() {
  const { isOnboardingOpen, user, updateProfile, redirectPath } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [sex, setSex] = useState(user?.sex || 'male');
  const [weight, setWeight] = useState(user?.weight ? String(user.weight) : '');
  const [height, setHeight] = useState(user?.height ? String(user.height) : '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOnboardingOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanName = name.trim();
    if (!cleanName) {
      setError('Please provide your name or nickname');
      return;
    }

    const numAge = parseInt(age, 10);
    if (isNaN(numAge) || numAge < 10 || numAge > 110) {
      setError('Please enter a valid age between 10 and 110');
      return;
    }

    const numWeight = parseFloat(weight);
    if (isNaN(numWeight) || numWeight < 25 || numWeight > 300) {
      setError('Please enter a valid weight in kg (25 - 300 kg)');
      return;
    }

    const numHeight = parseFloat(height);
    if (isNaN(numHeight) || numHeight < 80 || numHeight > 250) {
      setError('Please enter a valid height in cm (80 - 250 cm)');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateProfile({
        name: cleanName,
        age: numAge,
        sex,
        weight: numWeight,
        height: numHeight,
      });

      if (!res.success) {
        setError(res.error || 'Failed to save profile. Please try again.');
      } else {
        // If user was heading to a protected target like /tracker, navigate immediately
        if (redirectPath) {
          navigate(redirectPath);
        }
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-2xl border transition-all duration-200 shadow-2xl overflow-hidden ${
          darkMode
            ? 'bg-[#14141e] border-neutral-800 text-white shadow-black/80'
            : 'bg-white border-neutral-200 text-neutral-900 shadow-xl'
        }`}
      >
        {/* Top Accent Graphic Banner */}
        <div className="px-6 pt-6 pb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-500 border border-orange-500/20 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Personalize Your Experience</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Complete Your Fitness Profile
          </h2>
          <p
            className={`text-xs sm:text-sm mt-1 leading-relaxed ${
              darkMode ? 'text-neutral-400' : 'text-neutral-600'
            }`}
          >
            BurnIt uses these biometrics to calculate accurate calorie expenditure, basal metabolic rate, and custom range-of-motion metrics during workouts.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="px-6 pt-2">
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Full Name */}
          <div>
            <label
              htmlFor="onboarding-name"
              className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                darkMode ? 'text-neutral-400' : 'text-neutral-600'
              }`}
            >
              Full Name or Nickname
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User
                  className={`w-4 h-4 ${
                    darkMode ? 'text-neutral-500' : 'text-neutral-400'
                  }`}
                />
              </div>
              <input
                id="onboarding-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Johnson"
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border transition-colors outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 ${
                  darkMode
                    ? 'bg-[#1a1a27] border-neutral-800 text-white placeholder-neutral-500'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
                }`}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Age & Sex Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Age */}
            <div>
              <label
                htmlFor="onboarding-age"
                className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  darkMode ? 'text-neutral-400' : 'text-neutral-600'
                }`}
              >
                Age (years)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar
                    className={`w-4 h-4 ${
                      darkMode ? 'text-neutral-500' : 'text-neutral-400'
                    }`}
                  />
                </div>
                <input
                  id="onboarding-age"
                  type="number"
                  min="10"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 25"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border transition-colors outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 ${
                    darkMode
                      ? 'bg-[#1a1a27] border-neutral-800 text-white placeholder-neutral-500'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
                  }`}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Sex */}
            <div>
              <span
                className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  darkMode ? 'text-neutral-400' : 'text-neutral-600'
                }`}
              >
                Sex
              </span>
              <div
                className={`grid grid-cols-3 p-1 rounded-xl border ${
                  darkMode
                    ? 'bg-[#1a1a27] border-neutral-800'
                    : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                {['male', 'female', 'other'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSex(option)}
                    className={`py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                      sex === option
                        ? 'bg-orange-600 text-white shadow-sm'
                        : darkMode
                        ? 'text-neutral-400 hover:text-white'
                        : 'text-neutral-600 hover:text-black'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Weight & Height Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Weight */}
            <div>
              <label
                htmlFor="onboarding-weight"
                className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  darkMode ? 'text-neutral-400' : 'text-neutral-600'
                }`}
              >
                Weight (kg)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Scale
                    className={`w-4 h-4 ${
                      darkMode ? 'text-neutral-500' : 'text-neutral-400'
                    }`}
                  />
                </div>
                <input
                  id="onboarding-weight"
                  type="number"
                  step="0.5"
                  min="20"
                  max="350"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 70"
                  className={`w-full pl-9 pr-12 py-2.5 rounded-xl text-sm border transition-colors outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 ${
                    darkMode
                      ? 'bg-[#1a1a27] border-neutral-800 text-white placeholder-neutral-500'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
                  }`}
                  disabled={isSubmitting}
                />
                <span
                  className={`absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-medium ${
                    darkMode ? 'text-neutral-500' : 'text-neutral-400'
                  }`}
                >
                  kg
                </span>
              </div>
            </div>

            {/* Height */}
            <div>
              <label
                htmlFor="onboarding-height"
                className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  darkMode ? 'text-neutral-400' : 'text-neutral-600'
                }`}
              >
                Height (cm)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Ruler
                    className={`w-4 h-4 ${
                      darkMode ? 'text-neutral-500' : 'text-neutral-400'
                    }`}
                  />
                </div>
                <input
                  id="onboarding-height"
                  type="number"
                  step="0.5"
                  min="70"
                  max="260"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="e.g. 175"
                  className={`w-full pl-9 pr-12 py-2.5 rounded-xl text-sm border transition-colors outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 ${
                    darkMode
                      ? 'bg-[#1a1a27] border-neutral-800 text-white placeholder-neutral-500'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
                  }`}
                  disabled={isSubmitting}
                />
                <span
                  className={`absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-medium ${
                    darkMode ? 'text-neutral-500' : 'text-neutral-400'
                  }`}
                >
                  cm
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-full bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white text-sm font-semibold shadow-lg shadow-orange-600/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <span>Save & Start Training</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

