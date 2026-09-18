import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ExperienceSubmissionForm } from '../components/forms/ExperienceSubmissionForm';

export const JourneySubmitPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-ink-50/40 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        <Link
          to="/journey"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-600 hover:text-ink-900 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به درگاه تور نوآوری</span>
        </Link>

        <ExperienceSubmissionForm />
      </div>
    </div>
  );
};
