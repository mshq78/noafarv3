import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui';
import { NoafarMark } from '../brand/NoafarMark';
import { TricolorRule } from '../brand/TricolorRule';
import { DotPattern } from '../brand/DotPattern';

export const LandingHero: React.FC = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <section className="relative overflow-hidden bg-white border-b border-ink-100">
      {/* Background with soft brand color gradients & DotPattern */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 right-1/4 w-[420px] h-[420px] rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: '#73CFED' }}
        />
        <div
          className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[460px] h-[460px] rounded-full blur-3xl opacity-15"
          style={{ backgroundColor: '#FFCC6D' }}
        />
        <div
          className="absolute -bottom-32 right-1/3 w-[400px] h-[400px] rounded-full blur-3xl opacity-15"
          style={{ backgroundColor: '#ED3F86' }}
        />
        <DotPattern opacity={0.06} />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 py-16 sm:py-24 lg:py-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="flex flex-col items-center text-center space-y-6"
        >
          {/* 1. Noafar Mark */}
          <div className="inline-flex p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-sky-100 ring-4 ring-white/50 mb-1">
            <NoafarMark size={48} />
          </div>

          {/* 2. Main Title */}
          <h1 className="text-3xl sm:text-5xl font-black text-ink-900 leading-tight tracking-tight">
            مرکز نوآوری نوآفر
          </h1>

          {/* 3. Short description */}
          <p className="text-base sm:text-lg text-ink-700 leading-relaxed font-medium max-w-2xl mx-auto">
            نوآفر جایی است برای یاد گرفتن روشهای تازهٔ حل مسئلههای اجتماعی و فرهنگی — ابزارها، تجربههای واقعی، آموزشها و آدمهایی که کار متفاوت میکنند.
          </p>

          {/* 4. Link to /about with ArrowLeft */}
          <div>
            <Link
              to="/about"
              className="inline-flex items-center gap-1.5 text-sm sm:text-base font-semibold text-sky-700 hover:text-sky-800 transition-colors group"
            >
              <span>آشنایی بیشتر با نوآفر</span>
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </Link>
          </div>

          {/* 5. TricolorRule divider */}
          <div className="w-28 sm:w-36 mx-auto py-2">
            <TricolorRule height={3} />
          </div>

          {/* 6. Search Box */}
          <form
            onSubmit={handleSearchSubmit}
            className="w-full max-w-2xl mx-auto pt-2"
            role="search"
          >
            <div className="relative flex items-center bg-white rounded-2xl border border-ink-200 shadow-sm hover:border-ink-300 focus-within:border-sky-500 focus-within:ring-4 focus-within:ring-sky-100 transition-all p-1.5 sm:p-2">
              <div className="pe-2 ps-3 text-ink-400 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-ink-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجو در نوآفر…"
                aria-label="جستجو در نوآفر"
                className="w-full bg-transparent border-none text-ink-900 placeholder:text-ink-400 text-sm sm:text-base focus:outline-none focus:ring-0 px-2 py-2"
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="shrink-0 font-medium px-5 sm:px-6 rounded-xl"
              >
                جستجو
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

