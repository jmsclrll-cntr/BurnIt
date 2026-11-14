import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Terms() {
  const navigate = useNavigate();
  return (
    <main className="min-h-screen font-sans antialiased transition-colors duration-300 bg-[#0e0e12] text-neutral-100">
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-orange-500 mb-6">Terms & Conditions</h1>
        <p className="mb-4">
          By using the BURN IT platform you agree to the following terms and conditions.
        </p>
        <h2 className="text-2xl font-semibold mt-6 mb-2">Acceptable Use</h2>
        <ul className="list-disc list-inside space-y-2 mb-4">
          <li>Use the service for personal fitness and training purposes only.</li>
          <li>Do not distribute illegal, harmful, or copyrighted content.</li>
          <li>Respect other users and do not harass or intimidate.</li>
        </ul>
        <h2 className="text-2xl font-semibold mt-6 mb-2">User Responsibilities</h2>
        <p className="mb-4">
          You are responsible for the accuracy of the data you enter, and you must follow any applicable laws and regulations regarding health and fitness advice.
        </p>
        <h2 className="text-2xl font-semibold mt-6 mb-2">Disclaimers</h2>
        <p className="mb-4">
          BURN IT provides tools and information to help you with your fitness journey. It does not replace professional medical or coaching advice. Use the platform at your own risk and consult qualified professionals when needed.
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
