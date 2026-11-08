import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const getApiBase = () => {
  // Use relative path so all requests route through Vite's reverse proxy seamlessly.
  // This completely eliminates Mixed Content (HTTPS -> HTTP) and CORS errors on mobile/tablet devices.
  return '';
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('burnit_token') || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('burnit_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'signup'
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [redirectPath, setRedirectPath] = useState(null);

  // Sync profile metrics to individual localStorage keys for calorie prediction integration
  const syncBiometricsToStorage = useCallback((profile) => {
    if (!profile) return;
    try {
      if (profile.weight) localStorage.setItem('burnit_user_weight', String(profile.weight));
      if (profile.height) localStorage.setItem('burnit_user_height', String(profile.height));
      if (profile.age) localStorage.setItem('burnit_user_age', String(profile.age));
      if (profile.sex) localStorage.setItem('burnit_user_sex', String(profile.sex));
      if (profile.name) localStorage.setItem('burnit_user_name', String(profile.name));
    } catch (e) {
      console.warn('Could not sync biometrics to localStorage:', e);
    }
  }, []);

  // Verify and refresh current user profile on app launch if token exists
  useEffect(() => {
    let isMounted = true;
    const fetchMe = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch(`${getApiBase()}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const profile = await res.json();
          if (isMounted) {
            setUser(profile);
            localStorage.setItem('burnit_user', JSON.stringify(profile));
            syncBiometricsToStorage(profile);
          }
        } else if (res.status === 401) {
          // Token expired or invalid
          if (isMounted) {
            setToken(null);
            setUser(null);
            localStorage.removeItem('burnit_token');
            localStorage.removeItem('burnit_user');
          }
        }
      } catch (err) {
        console.warn('Failed to verify session token:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchMe();
    return () => {
      isMounted = false;
    };
  }, [token, syncBiometricsToStorage]);

  const openLogin = useCallback((target = null) => {
    setAuthModalMode('login');
    if (target) setRedirectPath(target);
    setIsAuthModalOpen(true);
  }, []);

  const openSignUp = useCallback((target = null) => {
    setAuthModalMode('signup');
    if (target) setRedirectPath(target);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const openOnboarding = useCallback(() => {
    setIsOnboardingOpen(true);
  }, []);

  const closeOnboarding = useCallback(() => {
    setIsOnboardingOpen(false);
  }, []);

  const login = useCallback(
    async (username, password) => {
      try {
        const res = await fetch(`${getApiBase()}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || 'Login failed. Please check your credentials.');
        }

        setToken(data.access_token);
        setUser(data.user);
        localStorage.setItem('burnit_token', data.access_token);
        localStorage.setItem('burnit_user', JSON.stringify(data.user));
        syncBiometricsToStorage(data.user);

        setIsAuthModalOpen(false);

        const needOnboarding = !data.user?.is_profile_completed;
        if (needOnboarding) {
          setIsOnboardingOpen(true);
        }

        return {
          success: true,
          user: data.user,
          needOnboarding,
          redirect: redirectPath,
        };
      } catch (err) {
        return {
          success: false,
          error: err.message || 'Login failed',
        };
      }
    },
    [redirectPath, syncBiometricsToStorage]
  );

  const register = useCallback(
    async (username, password) => {
      try {
        const res = await fetch(`${getApiBase()}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || 'Registration failed.');
        }

        setToken(data.access_token);
        setUser(data.user);
        localStorage.setItem('burnit_token', data.access_token);
        localStorage.setItem('burnit_user', JSON.stringify(data.user));
        syncBiometricsToStorage(data.user);

        setIsAuthModalOpen(false);
        // Brand new user always requires onboarding
        setIsOnboardingOpen(true);

        return {
          success: true,
          user: data.user,
          needOnboarding: true,
          redirect: redirectPath,
        };
      } catch (err) {
        return {
          success: false,
          error: err.message || 'Registration failed',
        };
      }
    },
    [redirectPath, syncBiometricsToStorage]
  );

  const updateProfile = useCallback(
    async (profileData) => {
      if (!token) {
        return { success: false, error: 'User is not authenticated' };
      }
      try {
        const res = await fetch(`${getApiBase()}/api/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: profileData.name,
            age: parseInt(profileData.age, 10),
            sex: profileData.sex,
            weight: parseFloat(profileData.weight),
            height: parseFloat(profileData.height),
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || 'Failed to update profile.');
        }

        setUser(data);
        localStorage.setItem('burnit_user', JSON.stringify(data));
        syncBiometricsToStorage(data);
        setIsOnboardingOpen(false);

        const target = redirectPath;
        setRedirectPath(null);

        return { success: true, user: data, redirect: target };
      } catch (err) {
        return { success: false, error: err.message || 'Failed to update profile' };
      }
    },
    [token, redirectPath, syncBiometricsToStorage]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setRedirectPath(null);
    setIsAuthModalOpen(false);
    setIsOnboardingOpen(false);
    try {
      localStorage.removeItem('burnit_token');
      localStorage.removeItem('burnit_user');
      localStorage.removeItem('burnit_user_weight');
      localStorage.removeItem('burnit_user_height');
      localStorage.removeItem('burnit_user_age');
      localStorage.removeItem('burnit_user_sex');
      localStorage.removeItem('burnit_user_name');
    } catch (e) {
      console.warn('Error clearing localStorage on logout:', e);
    }
  }, []);

  const clearRedirect = useCallback(() => {
    setRedirectPath(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: Boolean(token && user),
        isLoading,
        isAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        isOnboardingOpen,
        redirectPath,
        openLogin,
        openSignUp,
        closeAuthModal,
        openOnboarding,
        closeOnboarding,
        clearRedirect,
        login,
        register,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

