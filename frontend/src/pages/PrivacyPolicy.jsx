import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, EyeOff, Lock, Database, ArrowLeft, CheckCircle2, Cpu, HardDrive } from 'lucide-react';
import PageWrapper from '../components/PageWrapper';
import { useTheme } from '../hooks/useTheme';

export default function PrivacyPolicy() {
  const { darkMode } = useTheme();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <PageWrapper>
      <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Navigation Breadcrumb / Back to Home */}
        <div className="mb-8">
          <Link
            to="/"
            className={`inline-flex items-center gap-2 text-sm font-semibold transition-colors duration-150 rounded-full px-4 py-2 border ${darkMode
              ? 'bg-[#16161D] border-[#262630] text-neutral-300 hover:text-white hover:border-[#8A9CF7]'
              : 'bg-white border-[#E2E4E9] text-neutral-700 hover:text-[#0F0F0F] hover:border-[#3641C9]'
              }`}
          >
            <ArrowLeft className="w-4 h-4 text-[#3641C9] dark:text-[#8A9CF7]" />
            <span>Return to Home</span>
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-[#3641C9]/10 text-[#3641C9] dark:text-[#8A9CF7] border border-[#3641C9]/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Privacy by Architecture</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Privacy Policy
          </h1>
          <p className={`text-base sm:text-lg leading-relaxed ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
            Last updated: November 2026. This policy describes how BURN IT collects, uses, and safeguards your personal data, workout metrics, and biometric information.
          </p>
        </div>

        {/* Standout Architectural Guarantee Banner */}
        <div
          className={`p-6 sm:p-8 rounded-2xl border mb-12 shadow-md ${darkMode
            ? 'bg-gradient-to-br from-[#16161D] to-[#111116] border-[#3641C9]/30 shadow-[#3641C9]/5'
            : 'bg-gradient-to-br from-[#F0F2FE] to-[#F7F7F7] border-[#3641C9]/20 shadow-[#3641C9]/5'
            }`}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#3641C9] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#3641C9]/30">
              <EyeOff className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight">
                Core Architectural Guarantee: Zero Video Uploaded
              </h2>
              <p className={`text-sm sm:text-base leading-relaxed ${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
                BURN IT executes all MediaPipe pose landmark estimation, angle tracking, and repetition counting <strong className="text-[#3641C9] dark:text-[#8A9CF7] font-semibold">100% locally inside your web browser</strong> via WebAssembly and WebGL. <strong className="underline decoration-[#3641C9] dark:decoration-[#8A9CF7] decoration-2">No raw video frames, webcam feeds, or audio ever leave your device.</strong> Your camera feed is never sent to, recorded by, or stored on our servers.
              </p>
            </div>
          </div>
        </div>

        {/* Structured Sections */}
        <div className="space-y-10 text-sm sm:text-base leading-relaxed">
          {/* 1. Information We Collect */}
          <section
            className={`p-6 sm:p-8 rounded-2xl border transition-colors ${darkMode ? 'bg-[#16161D] border-[#262630]' : 'bg-white border-[#E2E4E9]'
              }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#3641C9]/10 text-[#3641C9] dark:text-[#8A9CF7] flex items-center justify-center font-bold">
                1
              </div>
              <h2 className="text-xl font-bold tracking-tight">Personal Information We Collect</h2>
            </div>
            <p className={`mb-4 ${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
              We collect only the minimal data required to deliver accurate workout analytics and authenticate your account:
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#3641C9] dark:text-[#8A9CF7] shrink-0 mt-0.5" />
                <span>
                  <strong>Account Credentials:</strong> Full name or display name, email address, and securely salted and hashed passwords for account creation and sign-in.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#3641C9] dark:text-[#8A9CF7] shrink-0 mt-0.5" />
                <span>
                  <strong>Biometric Baseline Profile:</strong> Age, biological sex, body weight (in pounds or kilograms), and height. These metrics are used strictly for metabolic equivalent (MET) and Harris-Benedict caloric expenditure formulas.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#3641C9] dark:text-[#8A9CF7] shrink-0 mt-0.5" />
                <span>
                  <strong>Workout Session Telemetry:</strong> Finished workout records including exercise type (squats, push-ups, plank, jumping jacks, bicep curls), completed repetition count, workout duration, dumbbell/barbell weight lifted (if applicable), and predicted calories burned.
                </span>
              </li>
            </ul>
          </section>

          {/* 2. How Data is Used and Stored */}
          <section
            className={`p-6 sm:p-8 rounded-2xl border transition-colors ${darkMode ? 'bg-[#16161D] border-[#262630]' : 'bg-white border-[#E2E4E9]'
              }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#3641C9]/10 text-[#3641C9] dark:text-[#8A9CF7] flex items-center justify-center font-bold">
                2
              </div>
              <h2 className="text-xl font-bold tracking-tight">How Personal Information is Used & Stored</h2>
            </div>
            <p className={`mb-4 ${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
              Your data is utilized solely to deliver and improve your personal workout experience:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={`p-4 rounded-xl border ${darkMode ? 'bg-[#16161D] border-[#262630]' : 'bg-[#F7F7F7] border-[#E2E4E9]'
                  }`}
              >
                <div className="flex items-center gap-2 font-bold mb-2 text-[#3641C9] dark:text-[#8A9CF7]">
                  <Database className="w-4 h-4" />
                  <span>Secure Encrypted Storage</span>
                </div>
                <p className={`text-xs sm:text-sm ${darkMode ? 'text-neutral-300' : 'text-neutral-600'}`}>
                  User records and workout logs are housed in an enterprise MySQL database with strict access control and encrypted communication (TLS/SSL).
                </p>
              </div>

              <div
                className={`p-4 rounded-xl border ${darkMode ? 'bg-[#16161D] border-[#262630]' : 'bg-[#F7F7F7] border-[#E2E4E9]'
                  }`}
              >
                <div className="flex items-center gap-2 font-bold mb-2 text-[#3641C9] dark:text-[#8A9CF7]">
                  <Lock className="w-4 h-4" />
                  <span>Zero Third-Party Selling</span>
                </div>
                <p className={`text-xs sm:text-sm ${darkMode ? 'text-neutral-300' : 'text-neutral-600'}`}>
                  We never sell, rent, monetize, or disclose your personal fitness logs or biometric attributes to third-party data brokers, insurers, or advertisers.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Client-Side Video & Kinematic Processing */}
          <section
            className={`p-6 sm:p-8 rounded-2xl border transition-colors ${darkMode ? 'bg-[#16161D] border-[#262630]' : 'bg-white border-[#E2E4E9]'
              }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#3641C9]/10 text-[#3641C9] dark:text-[#8A9CF7] flex items-center justify-center font-bold">
                3
              </div>
              <h2 className="text-xl font-bold tracking-tight">Workout Activities & Progress Information</h2>
            </div>
            <p className={`mb-3 ${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
              During an active session, the camera feed is evaluated frame-by-frame entirely inside your computer&apos;s volatile RAM and GPU memory. The calculated landmark coordinates (33 skeletal points) are converted into joint angles (e.g. knee flexion for squats, elbow flexion for curls). Once the session ends, only the high-level quantitative summary (total reps, duration, caloric estimation) is submitted to your workout history.
            </p>
            <p className={`text-xs sm:text-sm ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
              You can inspect this behavior at any time in your browser Developer Tools (Network tab) — no binary video streams or image payloads are dispatched during camera sessions.
            </p>
          </section>

          {/* 4. Data Protection & Privacy Rights */}
          <section
            className={`p-6 sm:p-8 rounded-2xl border transition-colors ${darkMode ? 'bg-[#16161D] border-[#262630]' : 'bg-white border-[#E2E4E9]'
              }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#3641C9]/10 text-[#3641C9] dark:text-[#8A9CF7] flex items-center justify-center font-bold">
                4
              </div>
              <h2 className="text-xl font-bold tracking-tight">Your Data Protection Rights</h2>
            </div>
            <p className={`mb-4 ${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
              In accordance with global privacy frameworks (including GDPR and CCPA), you possess the following rights:
            </p>
            <ul className="space-y-2 text-sm sm:text-base">
              <li>• <strong>Access & Portability:</strong> View your entire workout history and profile metrics anytime through your User Profile.</li>
              <li>• <strong>Rectification:</strong> Correct or update your biometric attributes (weight, age, height) instantly in your account settings.</li>
              <li>• <strong>Erasure:</strong> Request permanent deletion of your account and all associated workout historical data.</li>
            </ul>
          </section>

          {/* 5. Contact & Assistance */}
          <section
            className={`p-6 sm:p-8 rounded-2xl border transition-colors ${darkMode ? 'bg-[#16161D] border-[#262630]' : 'bg-white border-[#E2E4E9]'
              }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#3641C9]/10 text-[#3641C9] dark:text-[#8A9CF7] flex items-center justify-center font-bold">
                5
              </div>
              <h2 className="text-xl font-bold tracking-tight">Assistance Regarding Personal Information</h2>
            </div>
            <p className={`mb-6 ${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
              If you have any questions regarding this Privacy Policy, wish to exercise your data protection rights, or request an account data purge, our data compliance team is available to assist you:
            </p>
            <div className="flex flex-wrap gap-4 items-center">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#3641C9] hover:bg-[#2C35A8] active:bg-[#14006A] text-white font-semibold text-sm shadow-md shadow-[#3641C9]/30 transition-all"
              >
                <span>Contact Privacy Team</span>
              </Link>
              <a
                href="mailto:privacy@burnit.fitness"
                className={`text-sm font-medium transition-colors ${darkMode ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
              >
                privacy@burnit.fitness
              </a>
            </div>
          </section>
        </div>

        {/* Return to Home Bottom CTA */}
        <div className="mt-12 pt-8 border-t border-neutral-800/20 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#3641C9] dark:text-[#8A9CF7] hover:underline transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to BURN IT Homepage</span>
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
}

