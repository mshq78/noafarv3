import React from 'react';
import {
  GraduationCap,
  Wrench,
  BookOpen,
  Footprints,
  Users,
  Sparkles,
} from 'lucide-react';

/**
 * Shared Lucide icon mapping for all 6 innovation portals (sections).
 */
export const ICON_MAP: Record<string, React.ReactNode> = {
  GraduationCap: <GraduationCap className="w-7 h-7" />,
  Wrench: <Wrench className="w-7 h-7" />,
  BookOpen: <BookOpen className="w-7 h-7" />,
  Footprints: <Footprints className="w-7 h-7" />,
  Users: <Users className="w-7 h-7" />,
  Sparkles: <Sparkles className="w-7 h-7" />,
};

/**
 * Helper to obtain the dark text color class for each section color family.
 */
export const getSectionDarkColorClass = (colorFamily?: string): string => {
  switch (colorFamily) {
    case 'pink':
      return 'text-pink-700';
    case 'amber':
      return 'text-amber-800';
    case 'sky':
    default:
      return 'text-sky-800';
  }
};
