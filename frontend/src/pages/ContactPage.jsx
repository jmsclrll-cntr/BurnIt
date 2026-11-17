import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Phone,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  MessageSquare,
  Sparkles,
  Loader2,
  Building2,
} from 'lucide-react';
import PageWrapper from '../components/PageWrapper';
import { useTheme } from '../hooks/useTheme';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactPage() {
  const { darkMode } = useTheme();

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const validateField = (field, value) => {
    let err = '';
    const clean = String(value || '').trim();

    if (field === 'name') {
      if (!clean) err = 'Full Name is required.';
      else if (clean.length < 2) err = 'Name must be at least 2 characters.';
    } else if (field === 'email') {
      if (!clean) err = 'Email Address is required.';
      else if (!EMAIL_REGEX.test(clean)) err = 'Please enter a valid email address (e.g. name@domain.com).';
    } else if (field === 'subject') {
      if (!clean) err = 'Subject line is required.';
      else if (clean.length < 2) err = 'Subject must be at least 2 characters.';
    } else if (field === 'message') {
      if (!clean) err = 'Message is required.';
      else if (clean.length < 5) err = 'Message must be at least 5 characters.';
    }
    return err;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Real-time validation clear on change
    if (errors[name]) {
      const err = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSubmitStatus('error');
      setStatusMessage('Please correct the highlighted fields before sending your message.');
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    setSubmitStatus(null);
    setStatusMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.detail?.[0]?.msg || data?.message || `Server responded with status ${response.status}.`
        );
      }

      // Success
      setSubmitStatus('success');
      setStatusMessage(
        data?.message ||
        `Thank you, ${formData.name.trim()}! Your message has been received. Our team will contact you shortly at ${formData.email.trim()}.`
      );

      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    } catch (err) {
      console.error('Contact form submission failed:', err);
      setSubmitStatus('error');
      setStatusMessage(
        err.message ||
        'Failed to send your message. Please check your network connection or email us directly at support@burnit.fitness.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Navigation Breadcrumb / Back to Home */}
        <div className="mb-8">
          <Link
            to="/"
            className={`inline-flex items-center gap-2 text-sm font-semibold transition-colors duration-150 rounded-full px-4 py-2 border ${darkMode
              ? 'bg-[#181822] border-[#2a2a36] text-neutral-300 hover:text-white hover:border-orange-500/60'
              : 'bg-white border-[#dcd8d2] text-[#4a463f] hover:text-[#17171c] hover:border-orange-500/60'
              }`}
          >
            <ArrowLeft className="w-4 h-4 text-orange-500" />
            <span>Return to Home</span>
          </Link>
        </div>

        {/* Page Title Header */}
        <div className="space-y-4 mb-12 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-orange-500/10 text-orange-500 border border-orange-500/20">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Direct Support Channel</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Get in Touch with BURN IT
          </h1>
          <p className={`text-base sm:text-lg leading-relaxed ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
            Have feedback on rep counting accuracy, questions regarding your workout metrics, or feature inquiries? Send us a message and our engineering and coaching team will respond within 24 hours.
          </p>
        </div>

        {/* Two-Column Responsive Layout: Contact Info & Interactive Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Official Contact Information (5 columns) */}
          <div className="lg:col-span-5 space-y-6">
            <div
              className={`p-6 sm:p-8 rounded-3xl border transition-colors ${darkMode ? 'bg-[#151520] border-[#272738]' : 'bg-white border-[#e3dfd7]'
                }`}
            >
              <h2 className="text-xl font-bold tracking-tight mb-6">Contact Information</h2>

              <div className="space-y-6">
                {/* Email Address */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-0.5">
                      Email Inquiries
                    </div>
                    <a
                      href="mailto:support@burnit.fitness"
                      className="text-base font-bold text-orange-500 hover:text-orange-600 transition-colors"
                    >
                      support@burnit.fitness
                    </a>
                    <div className={`text-xs mt-0.5 ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      General inquiries, data protection & feedback
                    </div>
                  </div>
                </div>

                {/* Telephone */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-0.5">
                      Direct Support Line
                    </div>
                    <a
                      href="tel:+18005552876"
                      className={`text-base font-bold transition-colors ${darkMode ? 'text-white hover:text-orange-400' : 'text-neutral-900 hover:text-orange-600'
                        }`}
                    >
                      +1 (800) 555-BURN (2876)
                    </a>
                    <div className={`text-xs mt-0.5 ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      Toll-free customer assistance
                    </div>
                  </div>
                </div>

                {/* Support Hours */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-0.5">
                      Support Hours
                    </div>
                    <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
                      Monday – Friday: 8:00 AM – 6:00 PM EST
                    </div>
                    <div className={`text-xs mt-0.5 ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      Weekend support monitored for critical issues
                    </div>
                  </div>
                </div>

                {/* Engineering Lab */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-0.5">
                      Biometrics Lab
                    </div>
                    <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
                      BURN IT Biometric Technologies
                    </div>
                    <div className={`text-xs mt-0.5 ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      New York, NY · Distributed Cloud Platform
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Response Promise Card */}
            <div
              className={`p-6 rounded-3xl border ${darkMode
                ? 'bg-gradient-to-br from-[#1b1928] to-[#141420] border-orange-500/20'
                : 'bg-gradient-to-br from-[#fff7f2] to-[#fffaf6] border-orange-300/40'
                }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm text-orange-500 mb-2">
                <Sparkles className="w-4 h-4" />
                <span>24-Hour Guarantee</span>
              </div>
              <p className={`text-xs sm:text-sm leading-relaxed ${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
                Every submission goes directly into our centralized inquiry triage system with immediate acknowledgment.
              </p>
            </div>
          </div>

          {/* Right Column: Actual Contact Form (7 columns) */}
          <div className="lg:col-span-7">
            <div
              className={`p-6 sm:p-10 rounded-3xl border shadow-xl transition-colors ${darkMode
                ? 'bg-[#151520] border-[#272738] shadow-black/50'
                : 'bg-white border-[#e3dfd7] shadow-neutral-900/5'
                }`}
            >
              <h2 className="text-2xl font-bold tracking-tight mb-2">Send Us a Message</h2>
              <p className={`text-sm mb-6 ${darkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                Fill in the details below. Required fields are marked with an asterisk (*).
              </p>

              {/* Status Alert Banner */}
              {submitStatus === 'success' && (
                <div
                  className={`p-4 rounded-2xl mb-6 border flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${darkMode
                    ? 'bg-[#182a1c] border-emerald-500/40 text-emerald-300'
                    : 'bg-[#edfcf2] border-emerald-400/50 text-emerald-900'
                    }`}
                  role="alert"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-bold mb-0.5">Message Sent Successfully</p>
                    <p className="leading-relaxed opacity-95">{statusMessage}</p>
                  </div>
                </div>
              )}

              {submitStatus === 'error' && (
                <div
                  className={`p-4 rounded-2xl mb-6 border flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${darkMode
                    ? 'bg-[#2b1616] border-red-500/40 text-red-300'
                    : 'bg-[#fef2f2] border-red-300 text-red-900'
                    }`}
                  role="alert"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-bold mb-0.5">Submission Error</p>
                    <p className="leading-relaxed opacity-95">{statusMessage}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {/* Full Name */}
                <div>
                  <label
                    htmlFor="contact-name"
                    className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-neutral-300' : 'text-neutral-700'
                      }`}
                  >
                    Full Name <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="contact-name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Alex Morgan"
                    disabled={isSubmitting}
                    className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.name
                      ? 'border-red-500 bg-red-500/5 text-red-200'
                      : darkMode
                        ? 'bg-[#1e1e2d] border-[#313144] text-white placeholder-neutral-500 focus:border-orange-500'
                        : 'bg-[#faf8f5] border-[#dcd8d2] text-[#17171c] placeholder-neutral-400 focus:border-orange-500'
                      }`}
                  />
                  {errors.name && (
                    <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.name}</span>
                    </p>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label
                    htmlFor="contact-email"
                    className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-neutral-300' : 'text-neutral-700'
                      }`}
                  >
                    Email Address <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="contact-email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. alex@example.com"
                    disabled={isSubmitting}
                    className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.email
                      ? 'border-red-500 bg-red-500/5 text-red-200'
                      : darkMode
                        ? 'bg-[#1e1e2d] border-[#313144] text-white placeholder-neutral-500 focus:border-orange-500'
                        : 'bg-[#faf8f5] border-[#dcd8d2] text-[#17171c] placeholder-neutral-400 focus:border-orange-500'
                      }`}
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>

                {/* Subject */}
                <div>
                  <label
                    htmlFor="contact-subject"
                    className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-neutral-300' : 'text-neutral-700'
                      }`}
                  >
                    Subject <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="contact-subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="e.g. Rep counting feedback / Partnership"
                    disabled={isSubmitting}
                    className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.subject
                      ? 'border-red-500 bg-red-500/5 text-red-200'
                      : darkMode
                        ? 'bg-[#1e1e2d] border-[#313144] text-white placeholder-neutral-500 focus:border-orange-500'
                        : 'bg-[#faf8f5] border-[#dcd8d2] text-[#17171c] placeholder-neutral-400 focus:border-orange-500'
                      }`}
                  />
                  {errors.subject && (
                    <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.subject}</span>
                    </p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="contact-message"
                    className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-neutral-300' : 'text-neutral-700'
                      }`}
                  >
                    Message <span className="text-orange-500">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Please describe how we can assist you..."
                    disabled={isSubmitting}
                    className={`w-full px-4 py-3 rounded-xl border text-sm transition-all resize-y focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.message
                      ? 'border-red-500 bg-red-500/5 text-red-200'
                      : darkMode
                        ? 'bg-[#1e1e2d] border-[#313144] text-white placeholder-neutral-500 focus:border-orange-500'
                        : 'bg-[#faf8f5] border-[#dcd8d2] text-[#17171c] placeholder-neutral-400 focus:border-orange-500'
                      }`}
                  ></textarea>
                  {errors.message && (
                    <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.message}</span>
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-orange-600 hover:bg-orange-500 active:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-orange-600/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Message...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Return to Home Bottom CTA */}
        <div className="mt-16 pt-8 border-t border-neutral-800/20 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to BURN IT Homepage</span>
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
}

