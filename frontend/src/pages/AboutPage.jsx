import React from 'react';
import PageWrapper from '../components/PageWrapper';
import AboutBurnIt from '../components/AboutBurnIt';

export default function AboutPage() {
  return (
    <PageWrapper>
      <main className="w-full">
        <AboutBurnIt />
      </main>
    </PageWrapper>
  );
}

