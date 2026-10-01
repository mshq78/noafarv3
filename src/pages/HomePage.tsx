import React from 'react';
import { LandingHero } from '../components/home/LandingHero';
import { SixTileGrid } from '../components/home/SixTileGrid';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <LandingHero />
      <SixTileGrid />
    </div>
  );
};
