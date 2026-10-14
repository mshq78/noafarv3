import React from 'react';
import { LandingHero } from '../components/home/LandingHero';
import { SixTileGrid } from '../components/home/SixTileGrid';
import { LatestCarousel } from '../components/home/LatestCarousel';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <LandingHero />
      <SixTileGrid />
      <LatestCarousel />
    </div>
  );
};
