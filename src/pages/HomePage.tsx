import React from 'react';
import { LandingHero } from '../components/home/LandingHero';
import { SectionShowcase } from '../components/home/SectionShowcase';
import { SixTileGrid } from '../components/home/SixTileGrid';
import { LatestHighlights } from '../components/home/LatestHighlights';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <LandingHero />
      <SectionShowcase />
      <SixTileGrid />
      <LatestHighlights />
    </div>
  );
};
