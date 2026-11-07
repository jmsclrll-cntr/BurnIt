import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageWrapper from '../../components/PageWrapper';
import { useTheme } from '../../hooks/useTheme';
import { heartRateService } from '../../services/heartRateService';
import {
  Heart,
  Bluetooth,
  RefreshCw,
  AlertCircle,
  Clock,
  ArrowLeft,
  Smartphone,
  Eye,
  Watch,
} from 'lucide-react';

const WATCH_GUIDES = {
  xiaomi: {
    id: 'xiaomi',
    name: 'Xiaomi / Band 9',
    steps: [
      'On Band 9: Open Settings → Heart Rate → Turn "Heart Rate Broadcast" ON.',
      'Alternative: Start a "Freestyle" workout on the band so the optical sensor activates.',
      'Swipe away / Close the Mi Fitness app on your phone to release the Bluetooth lock.',
    ],
  },
  garmin: {
    id: 'garmin',
    name: 'Garmin',
    steps: [
      'Hold the Menu / Up button on your Garmin watch.',
      'Go to Sensors & Accessories → Wrist Heart Rate → Broadcast Heart Rate.',
      'Select Start. Your Garmin watch will show "Broadcasting..." and appear in Chrome.',
    ],
  },
  apple: {
    id: 'apple',
    name: 'Apple Watch',
    steps: [
      'Open the watchOS App Store and install free companion app "HeartCast" or "Echo".',
      'Open HeartCast on your Apple Watch and tap "Start Broadcast".',
      'Your Apple Watch will stream standard open BLE Heart Rate (0x180D).',
    ],
  },
  samsung: {
    id: 'samsung',
    name: 'Samsung / Wear OS',
    steps: [
      'On Galaxy Watch 4/5/6/7 or Pixel Watch, install "Heart Rate Broadcaster" from Google Play on your watch.',
      'Open the app on your watch and tap "Start Broadcasting".',
      'Select your watch in Chrome\'s Bluetooth pairing popup.',
    ],
  },
  polar: {
    id: 'polar',
    name: 'Polar / Wahoo',
    steps: [
      'Moisten the strap sensors and put on your Polar H10, Verity Sense, or Wahoo TICKR.',
      'These dedicated monitors broadcast standard BLE Heart Rate automatically when worn.',
      'Tap "Connect Smartwatch" to pair instantly.',
    ],
  },
};

/**
 * LiveHeartRate Component
 * 
 * Separate UI component that connects to Xiaomi Smart Band 9 via heartRateService.
 * Subscribes to Bluetooth readings and status changes without housing any direct
 * Web Bluetooth protocol logic.
 * Universal Smartwatch & Fitness Monitor UI connecting via heartRateService.
 * Compatible with Xiaomi Band 9, Garmin, Apple Watch (HeartCast), Samsung Galaxy Watch,
 * Polar, Wahoo, and all standard Bluetooth SIG Heart Rate (0x180D) devices.
 */
export default function LiveHeartRate() {
  const { darkMode } = useTheme();

  // Component state driven exclusively by heartRateService subscriptions
  const [bpm, setBpm] = useState(null);
  const [lastReadingTime, setLastReadingTime] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [status, setStatus] = useState('Not connected');
  const [deviceName, setDeviceName] = useState('');
  const [autoRetryCount, setAutoRetryCount] = useState(0);
  const [activeBrandTab, setActiveBrandTab] = useState('xiaomi');
  const [errorMessage, setErrorMessage] = useState(() =>
    !heartRateService.isSupported()
      ? 'Web Bluetooth is not supported in this browser. Please use Google Chrome on an Android phone or computer.'
      : null
  );
  const [isSupported] = useState(() => heartRateService.isSupported());

  // Subscribe to heartRateService on mount
  useEffect(() => {
    // 1. Subscribe to status changes
    const unsubStatus = heartRateService.onStatusChange((state) => {
      setStatus(state.status);
      setDeviceName(state.deviceName);
      setAutoRetryCount(state.autoRetryCount);
      if (state.lastBpm) setBpm(state.lastBpm);
      if (state.lastReadingTime) setLastReadingTime(state.lastReadingTime);
    });

    // 2. Subscribe to incoming live readings
    const unsubReading = heartRateService.onReading((newBpm, timestamp) => {
      setBpm(newBpm);
      setLastReadingTime(timestamp);
      setErrorMessage(null); // Clear errors on fresh data
    });

    // 3. Subscribe to error messages
    const unsubError = heartRateService.onError((errMsg) => {
      setErrorMessage(errMsg);
    });

    return () => {
      unsubStatus();
      unsubReading();
      unsubError();
    };
  }, []);

  // Update relative timestamp ticker every second
  useEffect(() => {
    if (!lastReadingTime) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [lastReadingTime]);

  // Derived relative time text
  const timeAgoText = (() => {
    if (!lastReadingTime) return '';
    const diffSecs = Math.max(0, Math.round((now - lastReadingTime.getTime()) / 1000));
    if (diffSecs < 3) return 'Just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    return `${Math.floor(diffSecs / 60)}m ago`;
  })();

  // Handlers for user-initiated gestures
  const handleConnect = useCallback(async () => {
    setErrorMessage(null);
    try {
      await heartRateService.connect();
    } catch {
      // Error is caught and surfaced via onError listener
    }
  }, []);

  const handleReconnect = useCallback(async () => {
    setErrorMessage(null);
    try {
      await heartRateService.reconnect();
    } catch {
      // Error handled by service
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    await heartRateService.disconnect();
    setErrorMessage(null);
  }, []);

  // Compute heart rate intensity zones based on standard guidelines
  const getHeartRateZone = (val) => {
    if (!val) return null;
    if (val < 100) return { label: 'Warm Up / Rest', color: 'text-blue-500', bg: 'bg-blue-500/10' };
    if (val < 125) return { label: 'Fat Burn (Zone 2)', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    if (val < 150) return { label: 'Aerobic (Zone 3)', color: 'text-amber-500', bg: 'bg-amber-500/10' };
    if (val < 170) return { label: 'Anaerobic (Zone 4)', color: 'text-orange-500', bg: 'bg-orange-500/10' };
    return { label: 'Max Effort (Zone 5)', color: 'text-rose-600', bg: 'bg-rose-500/20' };
  };

  const hrZone = getHeartRateZone(bpm);
  const isConnected = status === 'Connected';
  const isConnecting = status === 'Connecting...';
  const isDisconnected = status === 'Disconnected';

  // Construct status display text
  const getStatusLabel = () => {
    if (isConnecting) {
      return autoRetryCount > 0
        ? `Reconnecting (Attempt ${autoRetryCount} of 3)...`
        : 'Connecting...';
    }
    if (isConnected) {
      return `Connected: ${deviceName || 'Xiaomi Smart Band 9'}`;
      return `Connected: ${deviceName || 'Bluetooth Smartwatch'}`;
    }
    if (isDisconnected) {
      return 'Disconnected';
    }
    return 'Not connected';
  };

  const currentGuide = WATCH_GUIDES[activeBrandTab] || WATCH_GUIDES.xiaomi;

  return (
    <PageWrapper>
      <div className="max-w-xl mx-auto px-4 py-6 sm:py-10">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/tracker"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Workout Tracker</span>
          </Link>
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
            Web Bluetooth Vitals
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <Watch className="w-3.5 h-3.5 text-rose-500" />
              <span>Universal BLE Heart Rate</span>
            </span>
        </div>

        {/* Main Vitals Card */}
        <div
          className={`rounded-3xl border p-6 sm:p-8 text-center transition-all shadow-xl relative overflow-hidden ${darkMode
              ? 'bg-[#15151e] border-white/10 shadow-black/40'
              : 'bg-white border-neutral-200/80 shadow-neutral-200/50'
            }`}
        >
          {/* Subtle Ambient Background Glow on Active Heart Rate */}
          {isConnected && bpm && (
            <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-rose-500/10 blur-3xl pointer-events-none animate-pulse" />
          )}

          {/* Top Status Line Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium mb-6 backdrop-blur-md">
            <span
              className={`w-2 h-2 rounded-full transition-colors ${isConnected
                  ? 'bg-emerald-500 animate-pulse'
                  : isConnecting
                    ? 'bg-amber-400 animate-ping'
                    : isDisconnected
                      ? 'bg-rose-500'
                      : 'bg-neutral-400'
                }`}
            />
            <span
              className={`font-semibold ${isConnected
                  ? 'text-emerald-500'
                  : isConnecting
                    ? 'text-amber-400'
                    : isDisconnected
                      ? 'text-rose-500'
                      : 'text-neutral-400'
                }`}
            >
              {getStatusLabel()}
            </span>
          </div>

          {/* Large BPM Display */}
          <div className="my-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Heart
                className={`w-10 h-10 sm:w-12 sm:h-12 transition-all ${isConnected && bpm
                    ? 'text-rose-500 fill-rose-500 scale-110 animate-[pulse_0.8s_ease-in-out_infinite]'
                    : 'text-neutral-300 dark:text-neutral-700'
                  }`}
              />
              <span className="text-7xl sm:text-8xl font-black font-mono tracking-tighter text-neutral-900 dark:text-white">
                {isConnected && bpm ? bpm : '--'}
              </span>
              <span className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-neutral-400 self-end mb-3">
                BPM
              </span>
            </div>

            {/* Heart Rate Training Zone */}
            {isConnected && hrZone && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-mono">
                <span className={`px-2.5 py-0.5 rounded-full ${hrZone.bg} ${hrZone.color}`}>
                  {hrZone.label}
                </span>
              </div>
            )}
          </div>

          {/* Last Reading Timestamp */}
          <div className="min-h-[24px] flex items-center justify-center gap-2 text-xs text-neutral-400 mb-8 font-mono">
            {lastReadingTime ? (
              <>
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                <span>
                  Last reading: <strong>{lastReadingTime.toLocaleTimeString()}</strong>
                </span>
                {timeAgoText && (
                  <span className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 text-[11px] text-neutral-400">
                    ({timeAgoText})
                  </span>
                )}
              </>
            ) : (
              <span>Waiting for initial Bluetooth measurement...</span>
            )}
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            {!isConnected && !isConnecting && (
              <button
                onClick={handleConnect}
                disabled={!isSupported}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Bluetooth className="w-4 h-4" />
                <span>Connect Band</span>
                <span>Connect Smartwatch</span>
              </button>
            )}

            {isConnecting && (
              <button
                disabled
                className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center gap-2 cursor-wait"
              >
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Connecting to Band...</span>
                <span>Searching & Connecting...</span>
              </button>
            )}

            {isConnected && (
              <button
                onClick={handleDisconnect}
                className="w-full sm:w-auto px-7 py-3 rounded-full text-sm font-semibold border border-rose-500/40 text-rose-500 hover:bg-rose-500/10 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Disconnect</span>
              </button>
            )}

            {isDisconnected && (
              <button
                onClick={handleReconnect}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reconnect</span>
              </button>
            )}
          </div>

          {/* Screen Wake Lock Status Badge */}
          {isConnected && (
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 font-mono mb-4">
              <Eye className="w-3.5 h-3.5 text-emerald-500" />
              <span>Screen kept awake during workout</span>
            </div>
          )}

          {/* Error Message Alert (if any) */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-left text-xs flex items-start gap-3 text-rose-500">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block mb-0.5">Connection Notice</span>
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Setup & Troubleshooting Instructions */}
          <div className="p-4 rounded-2xl bg-neutral-100/70 dark:bg-white/5 border border-neutral-200/60 dark:border-white/5 text-left text-xs space-y-2.5">
            <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-200 font-semibold">
              <Smartphone className="w-4 h-4 text-orange-500" />
              <span>Xiaomi Smart Band 9 Setup Checklist</span>
              {/* Universal Watch Pairing Guide */}
              <div className="p-4 rounded-2xl bg-neutral-100/70 dark:bg-white/5 border border-neutral-200/60 dark:border-white/5 text-left text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-200 font-semibold">
                    <Smartphone className="w-4 h-4 text-orange-500" />
                    <span>Select Your Smartwatch Brand:</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">Standard BLE 0x180D</span>
                </div>
                <p className="text-neutral-500 dark:text-neutral-400 text-[11px] leading-relaxed">
                  On the band, start a workout and turn on heart rate broadcast in Mi Fitness. If the band
                  is not in the list, close the Mi Fitness app and try again.
                </p>
                <div className="pt-2 border-t border-neutral-200/60 dark:border-white/5 text-[11px] text-neutral-500 dark:text-neutral-400 space-y-1.5 font-mono">
                  <div className="flex items-start gap-1.5">
                    <span className="text-orange-500 font-bold">1.</span>
                    <span><strong>Phone Location (GPS):</strong> Must be turned <strong>ON</strong> in Android quick settings (required by Android for BLE scanning).</span>

                    {/* Brand Switcher Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {Object.values(WATCH_GUIDES).map((brand) => (
                        <button
                          key={brand.id}
                          onClick={() => setActiveBrandTab(brand.id)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap ${activeBrandTab === brand.id
                              ? 'bg-orange-600 text-white shadow-sm'
                              : darkMode
                                ? 'bg-white/5 text-neutral-400 hover:text-white'
                                : 'bg-neutral-200/60 text-neutral-600 hover:text-black'
                            }`}
                        >
                          {brand.name}
                        </button>
                      ))}
                    </div>

                    {/* Step-by-Step Instructions for Selected Brand */}
                    <div className="pt-2 border-t border-neutral-200/60 dark:border-white/5 text-[11px] text-neutral-600 dark:text-neutral-300 space-y-1.5">
                      <div className="font-semibold text-orange-500">
                        How to connect {currentGuide.name}:
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="text-orange-500 font-bold">2.</span>
                        <span><strong>Band Workout:</strong> On the band, open <strong>Workouts</strong> → start <strong>Freestyle</strong> (optical sensor turns green).</span>
                        {currentGuide.steps.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="w-4 h-4 rounded-full bg-orange-500/10 text-orange-500 font-bold font-mono text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{step}</span>
                          </div>
                        ))}
                        <div className="pt-1.5 text-[10px] text-neutral-400 font-mono">
                          💡 <em>Android requirement:</em> Keep Location (GPS) turned ON in phone settings for BLE device discovery.
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="text-orange-500 font-bold">3.</span>
                          <span><strong>Close Mi Fitness:</strong> Swipe away / Force Stop the Mi Fitness app so Android frees up the Bluetooth link.</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Medical Disclaimer Note (Required by Stage 1 & Stage 2) */}
                  {/* Medical Disclaimer Note */}
                  <p className="mt-6 text-center text-[11px] text-neutral-400 max-w-sm mx-auto leading-relaxed">
                    Heart rate readings are captured from a consumer fitness wearable and are not intended for
                    medical diagnosis or clinical treatment.
                  </p>
                </div>
              </PageWrapper>
              );
}
