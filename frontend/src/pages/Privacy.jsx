import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
  const navigate = useNavigate();
  return (
    <main className="min-h-screen font-sans antialiased transition-colors duration-300 bg-[#0e0e12] text-neutral-100">
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-orange-500 mb-6">Privacy Policy</h1>
        <p className="mb-4">
          BURN IT respects your privacy. This policy explains what personal information we collect, how we store and use it, and the rights you have.
        </p>
        <h2 className="text-2xl font-semibold mt-6 mb-2">Information We Collect</h2>
        <ul className="list-disc list-inside space-y-2 mb-4">
          <li>Account details you provide during sign‑up (name, email).</li>
          <li>Workout activity data you record through the tracker.</li>
          <li>Progress metrics such as workout history and performance stats.</li>
        </ul>
        <h2 className="text-2xl font-semibold mt-6 mb-2">How We Use Your Data</h2>
        <p className="mb-4">
          The data is stored securely on our servers to power the workout tracker, generate progress reports, and personalize your experience. We never sell your information to third parties.
        </p>
        <h2 className="text-2xl font-semibold mt-6 mb-2">Your Rights</h2>
        <p className="mb-4">
          You may request a copy of your data, request its deletion, or update any inaccurate information by contacting us via the Contact page.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
        >
          ← Back to site
        </button>
      </section>
    </main>
  );
}
