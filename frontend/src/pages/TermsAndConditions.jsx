import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, AlertTriangle, ShieldCheck, UserCheck, ArrowLeft, HeartPulse, CheckCircle2 } from 'lucide-react';
import PageWrapper from '../components/PageWrapper';
import { useTheme } from '../hooks/useTheme';

export default function TermsAndConditions() {
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
            <FileText className="w-3.5 h-3.5" />
            <span>Usage Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Terms and Conditions
          </h1>
          <p className={`text-base sm:text-lg leading-relaxed ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
            Effective Date: November 2026. Please read these Terms and Conditions thoroughly before utilizing the BURN IT workout platform, AI pose tracking, or calorie estimation software.
          </p>
        </div>

        {/* Mandatory Fitness & Health Disclaimer Callout */}
        <div
          className={`p-6 sm:p-8 rounded-2xl border mb-12 shadow-md ${darkMode
            ? 'bg-gradient-to-br from-[#16161D] to-[#111116] border-[#3641C9]/30 shadow-[#3641C9]/5'
            : 'bg-gradient-to-br from-[#F0F2FE] to-[#F7F7F7] border-[#3641C9]/20 shadow-[#3641C9]/5'
            }`}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#3641C9] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#3641C9]/30">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-[#3641C9] dark:text-[#8A9CF7]">
                Fitness & Medical Disclaimer: Exercise Responsibly
              </h2>
              <p className={`text-sm sm:text-base leading-relaxed ${darkMode ? 'text-neutral-200' : 'text-neutral-800'}`}>
                <strong>BURN IT is not a medical device or certified healthcare provider.</strong> All repetition counts, form feedback, joint angles, and predicted calorie burn are algorithmic approximations derived from computer vision heuristics and metabolic models. Always consult a qualified physician or healthcare professional prior to initiating any vigorous workout program, especially if you have pre-existing cardiovascular, spinal, or joint conditions.
              </p>
            </div>
          </div>
        </div>

        {/* Structured Terms Sections */}
        <div className="space-y-10 text-sm sm:text-base leading-relaxed">
          {/* 1. Acceptance of Terms */}
          <section
            className={`p-6 sm:p-8 rounded-2xl border transition-colors ${darkMode ? 'bg-[#16161D] border-[#262630]' : 'bg-white border-[#E2E4E9]'
              }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#3641C9]/10 text-[#3641C9] dark:text-[#8A9CF7] flex items-center justify-center font-bold">
                1
              </div>
              <h2 className="text-xl font-bold tracking-tight">Acceptance of Terms</h2>
            </div>
            <p className={`${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
              By accessing, browsing, creating an account on, or interacting with the BURN IT platform, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree with any provision of these terms, you must refrain from using the application.
            </p>
          </section>

          {/* 2. Acceptable Use of BURN IT */}
          <section
            className={`p-6 sm:p-8 rounded-2xl border transition-colors ${darkMode ? 'bg-[#16161D] border-[#262630]' : 'bg-white border-[#E2E4E9]'
              }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#3641C9]/10 text-[#3641C9] dark:text-[#8A9CF7] flex items-center justify-center font-bold">
                2
              </div>
              <h2 className="text-xl font-bold tracking-tight">Acceptable Use of BURN IT</h2>
            </div>
            <p className={`mb-3 ${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
              BURN IT is licensed solely for personal, non-commercial fitness training and educational motion tracking. Under this agreement, you expressly agree not to:
            </p>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#3641C9] dark:text-[#8A9CF7] shrink-0 mt-0.5" />
                <span>Decompile, reverse engineer, or disassemble the client-side biomechanics algorithms or backend classification models.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#3641C9] dark:text-[#8A9CF7] shrink-0 mt-0.5" />
                <span>Interfere with or disrupt the integrity or performance of backend database services through automated bot traffic or denial-of-service attempts.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#3641C9] dark:text-[#8A9CF7] shrink-0 mt-0.5" />
                <span>Attempt to bypass authentication boundaries or access workout histories belonging to other users.</span>
              </li>
            </ul>
          </section>

          {/* 3. User Account Responsibilities */}
          <section
            className={`p-6 sm:p-8 rounded-2xl border transition-colors ${darkMode ? 'bg-[#16161D] border-[#262630]' : 'bg-white border-[#E2E4E9]'
              }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#3641C9]/10 text-[#3641C9] dark:text-[#8A9CF7] flex items-center justify-center font-bold">
                3
              </div>
              <h2 className="text-xl font-bold tracking-tight">Account Usage & User Responsibilities</h2>
            </div>
            <p className={`mb-4 ${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
              When you register an account with BURN IT:
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <UserCheck className="w-5 h-5 text-[#3641C9] dark:text-[#8A9CF7] shrink-0 mt-0.5" />
                <span>
                  <strong>Account Confidentiality:</strong> You are responsible for maintaining the confidentiality of your login credentials and for all activities conducted under your authenticated session.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <UserCheck className="w-5 h-5 text-[#3641C9] dark:text-[#8A9CF7] shrink-0 mt-0.5" />
                <span>
                  <strong>Data Accuracy:</strong> Providing reasonably accurate biometric data (body weight, biological sex, age) ensures that the mathematical models generate representative calorie estimations.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <UserCheck className="w-5 h-5 text-[#3641C9] dark:text-[#8A9CF7] shrink-0 mt-0.5" />
                <span>
                  <strong>Immediate Notification:</strong> You agree to notify BURN IT immediately if you suspect any unauthorized access or security breach involving your account.
                </span>
              </li>
            </ul>
          </section>

          {/* 4. Workout Safety & Physical Environment */}
          <section
            className={`p-6 sm:p-8 rounded-2xl border transition-colors ${darkMode ? 'bg-[#16161D] border-[#262630]' : 'bg-white border-[#E2E4E9]'
              }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#3641C9]/10 text-[#3641C9] dark:text-[#8A9CF7] flex items-center justify-center font-bold">
                4
              </div>
              <h2 className="text-xl font-bold tracking-tight">Training Environment & Physical Safety</h2>
            </div>
            <p className={`mb-3 ${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
              You acknowledge that engaging in physical exercise entails inherent risks of injury. You assume full personal responsibility for your physical safety by committing to:
            </p>
            <ul className="space-y-2 text-sm sm:text-base">
              <li>• Exercising in an open, dry, and well-lit space free from physical trip hazards, furniture, or slippery surfaces.</li>
              <li>• Using weights and exercise loads appropriate for your personal fitness level and prior physical training.</li>
              <li>• Stopping immediately if you experience dizziness, shortness of breath, unusual fatigue, or sharp joint pain.</li>
            </ul>
          </section>

          {/* 5. Limitation of Liability */}
          <section
            className={`p-6 sm:p-8 rounded-2xl border transition-colors ${darkMode ? 'bg-[#16161D] border-[#262630]' : 'bg-white border-[#E2E4E9]'
              }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#3641C9]/10 text-[#3641C9] dark:text-[#8A9CF7] flex items-center justify-center font-bold">
                5
              </div>
              <h2 className="text-xl font-bold tracking-tight">Limitation of Liability</h2>
            </div>
            <p className={`${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
              To the maximum extent permitted by applicable law, BURN IT and its developers shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use the software, including physical injury, health complications, or inaccurate data interpretation.
            </p>
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

