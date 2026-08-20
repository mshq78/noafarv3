import React from 'react';
import { LandingHero } from '../components/home/LandingHero';
import { SixTileGrid } from '../components/home/SixTileGrid';
import { GamificationStrip } from '../components/home/GamificationStrip';
import { LatestHighlights } from '../components/home/LatestHighlights';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <LandingHero />
      <SixTileGrid />
      <GamificationStrip />
      <LatestHighlights />
    </div>
  );
};
