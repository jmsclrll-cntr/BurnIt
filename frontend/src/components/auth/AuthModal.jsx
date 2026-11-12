import React, { useState } from 'react';
import { Flame, X, User, Lock, Eye, EyeOff, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    closeAuthModal,
    login,
    register,
  } = useAuth();
  const { darkMode } = useTheme();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const isLogin = authModalMode === 'login';

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleSwitchMode = (mode) => {
    setError('');
    setAuthModalMode(mode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanUser = username.trim();
    if (!cleanUser) {
      setError('Please enter your username');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    if (!isLogin) {
      if (cleanUser.length < 3) {
        setError('Username must be at least 3 characters');
        return;
      }
      if (password.length < 4) {
        setError('Password must be at least 4 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (isLogin) {
        const res = await login(cleanUser, password);
        if (!res.success) {
          setError(res.error || 'Invalid credentials');
        } else {
          resetForm();
        }
      } else {
        const res = await register(cleanUser, password);
        if (!res.success) {
          setError(res.error || 'Registration failed');
        } else {
          resetForm();
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div
        className={`w-full max-w-md rounded-2xl border transition-all duration-200 shadow-2xl overflow-hidden ${
          darkMode
            ? 'bg-[#14141e] border-neutral-800 text-white shadow-black/80'
            : 'bg-white border-neutral-200 text-neutral-900 shadow-xl'
        }`}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center shadow-md shadow-orange-600/30">
              <Flame className="w-4 h-4 text-white fill-white" />
            </div>
            <div className="font-bold text-sm tracking-tight">
              <span>BURN</span>
              <span className="text-orange-600">IT</span>
            </div>
          </div>

          <button
            type="button"
            onClick={closeAuthModal}
            className={`p-1.5 rounded-full transition-colors ${
              darkMode
                ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title & Subtitle */}
        <div className="px-6 pt-3 pb-4">
          <h2 className="text-xl font-bold tracking-tight">
            {isLogin ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p
            className={`text-xs mt-1 leading-relaxed ${
              darkMode ? 'text-neutral-400' : 'text-neutral-600'
            }`}
          >
            {isLogin
              ? 'Enter your credentials to access your workout telemetry and tracker.'
              : 'Sign up to track your workout sets, reps, and calorie burn in real-time.'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="px-6 pb-4">
          <div
            className={`grid grid-cols-2 p-1 rounded-xl border ${
              darkMode ? 'bg-[#1c1c2b] border-neutral-800' : 'bg-neutral-100 border-neutral-200'
            }`}
          >
            <button
              type="button"
              onClick={() => handleSwitchMode('login')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                isLogin
                  ? 'bg-orange-600 text-white shadow-sm'
                  : darkMode
                  ? 'text-neutral-400 hover:text-white'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('signup')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                !isLogin
                  ? 'bg-orange-600 text-white shadow-sm'
                  : darkMode
                  ? 'text-neutral-400 hover:text-white'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="px-6 pb-3">
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {/* Username Field */}
          <div>
            <label
              htmlFor="auth-username"
              className={`block text-xs font-medium mb-1.5 ${
                darkMode ? 'text-neutral-300' : 'text-neutral-700'
              }`}
            >
              Username
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
                id="auth-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border transition-colors outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 ${
                  darkMode
                    ? 'bg-[#1a1a27] border-neutral-800 text-white placeholder-neutral-500'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
                }`}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="auth-password"
              className={`block text-xs font-medium mb-1.5 ${
                darkMode ? 'text-neutral-300' : 'text-neutral-700'
              }`}
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock
                  className={`w-4 h-4 ${
                    darkMode ? 'text-neutral-500' : 'text-neutral-400'
                  }`}
                />
              </div>
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isLogin ? 'Enter your password' : 'Create a password (min 4 chars)'}
                className={`w-full pl-9 pr-10 py-2.5 rounded-xl text-sm border transition-colors outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 ${
                  darkMode
                    ? 'bg-[#1a1a27] border-neutral-800 text-white placeholder-neutral-500'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
                }`}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute inset-y-0 right-0 pr-3 flex items-center ${
                  darkMode
                    ? 'text-neutral-500 hover:text-neutral-300'
                    : 'text-neutral-400 hover:text-neutral-600'
                }`}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password (Sign Up Only) */}
          {!isLogin && (
            <div>
              <label
                htmlFor="auth-confirm-password"
                className={`block text-xs font-medium mb-1.5 ${
                  darkMode ? 'text-neutral-300' : 'text-neutral-700'
                }`}
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock
                    className={`w-4 h-4 ${
                      darkMode ? 'text-neutral-500' : 'text-neutral-400'
                    }`}
                  />
                </div>
                <input
                  id="auth-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border transition-colors outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 ${
                    darkMode
                      ? 'bg-[#1a1a27] border-neutral-800 text-white placeholder-neutral-500'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
                  }`}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 rounded-full bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white text-sm font-semibold shadow-md shadow-orange-600/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
              </>
            ) : (
              <>
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Switch Prompt */}
          <div className="pt-2 text-center text-xs">
            {isLogin ? (
              <span className={darkMode ? 'text-neutral-400' : 'text-neutral-600'}>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchMode('signup')}
                  className="text-orange-500 hover:text-orange-400 font-semibold underline underline-offset-2 ml-1"
                >
                  Sign Up
                </button>
              </span>
            ) : (
              <span className={darkMode ? 'text-neutral-400' : 'text-neutral-600'}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  className="text-orange-500 hover:text-orange-400 font-semibold underline underline-offset-2 ml-1"
                >
                  Log In
                </button>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

