import React from 'react';
import PageWrapper from '../components/PageWrapper';
import GuideWalkthrough from '../components/GuideWalkthrough';

export default function GuidePage() {
  return (
    <PageWrapper>
      <div className="w-full min-h-[calc(100vh-160px)] bg-[#f6f5f3] dark:bg-[#0e0e13] text-[#16140f] dark:text-[#f6f3ee] transition-colors duration-300">
        <div className="max-w-[1120px] mx-auto pt-[56px] pb-[72px] px-4 sm:px-6 lg:px-8">
          <GuideWalkthrough />
        </div>
      </div>
    </PageWrapper>
  );
}
