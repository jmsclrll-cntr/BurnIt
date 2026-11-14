import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Contact() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) newErrors.email = 'Invalid email format';
    if (!form.subject.trim()) newErrors.subject = 'Subject is required';
    if (!form.message.trim()) newErrors.message = 'Message is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus('submitting');
    try {
      const resp = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!resp.ok) throw new Error('Network response was not ok');
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <main className="min-h-screen font-sans antialiased transition-colors duration-300 bg-[#0e0e12] text-neutral-100">
      <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-orange-500 mb-6">Contact Us</h1>
        {status === 'success' && (
          <p className="mb-4 text-green-400" role="alert">
            Your message has been sent successfully!
          </p>
        )}
        {status === 'error' && (
          <p className="mb-4 text-red-400" role="alert">
            Something went wrong. Please try again later.
          </p>
        )}
        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
            />
            {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
            />
            {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="subject" className="block text-sm font-medium mb-1">Subject</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
            />
            {errors.subject && <p className="mt-1 text-sm text-red-400">{errors.subject}</p>}
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-1">Message</label>
            <textarea
              id="message"
              name="message"
              rows={5}
              value={form.message}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
            ></textarea>
            {errors.message && <p className="mt-1 text-sm text-red-400">{errors.message}</p>}
          </div>
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="self-start px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 disabled:opacity-50"
          >
            {status === 'submitting' ? 'Sending...' : 'Send Message'}
          </button>
        </form>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
        >
          ← Back to site
        </button>
      </section>
    </main>
  );
}
