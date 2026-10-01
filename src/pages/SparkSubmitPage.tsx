import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { IdeaSubmissionForm } from '../components/forms/IdeaSubmissionForm';
import { SECTIONS } from '../config/sections';
import { ComingSoonSection } from '../components/sections/ComingSoonSection';

export const SparkSubmitPage: React.FC = () => {
  // Submitting to a portal that has not opened yet would queue work nobody is
  // reviewing, so the form is closed for as long as the portal is.
  if (SECTIONS.spark.comingSoon) {
    return <ComingSoonSection section={SECTIONS.spark} />;
  }

  return (
    <div className="min-h-screen bg-ink-50/40 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        <Link
          to="/spark"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-600 hover:text-ink-900 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به درگاه جرقه</span>
        </Link>

        <IdeaSubmissionForm />
      </div>
    </div>
  );
};
