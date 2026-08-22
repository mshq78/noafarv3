import { useEffect, useState, useRef } from 'react';

/**
 * Hook for Mobile center-viewport IntersectionObserver
 * Highlights/colorizes the tile closest to the center of the mobile screen.
 */
export function useInViewColor<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    // Only apply on small/touch screens or viewport without fine pointer
    const isMobile = window.matchMedia('(max-width: 1023px)').matches;
    if (!isMobile || !ref.current) return;

    const element = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      {
        threshold: 0.6,
        rootMargin: '-20% 0px -20% 0px', // bias toward vertical center
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return { ref, isInView };
}
