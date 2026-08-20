import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './services/auth';
import { ToastProvider } from './components/ui/Toast';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { SectionListPage } from './pages/SectionListPage';
import { ContentDetailPage } from './pages/ContentDetailPage';
import { ToolCanvasPage } from './pages/ToolCanvasPage';
import { SparkSubmitPage } from './pages/SparkSubmitPage';
import { JourneySubmitPage } from './pages/JourneySubmitPage';
import { SearchPage } from './pages/SearchPage';
import { ProfilePage } from './pages/ProfilePage';
import { BlogListPage } from './pages/BlogListPage';
import { BlogDetailPage } from './pages/BlogDetailPage';
import { LoginPage } from './pages/LoginPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { AdminPage } from './pages/AdminPage';

// Scroll to top on route change helper
const ScrollToTop: React.FC = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
};

// Layout wrapper for standard pages with Header and Footer
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-ink-900 selection:bg-sky-100 selection:text-sky-900">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Fullscreen Canvas Route (without default header/footer) */}
            <Route path="/toolbox/:slug/canvas" element={<ToolCanvasPage />} />

            {/* Standard Routes with Header and Footer */}
            <Route
              path="/"
              element={
                <MainLayout>
                  <HomePage />
                </MainLayout>
              }
            />

            {/* Submissions */}
            <Route
              path="/spark/submit"
              element={
                <MainLayout>
                  <SparkSubmitPage />
                </MainLayout>
              }
            />
            <Route
              path="/journey/submit"
              element={
                <MainLayout>
                  <JourneySubmitPage />
                </MainLayout>
              }
            />

            {/* Search & Profile */}
            <Route
              path="/search"
              element={
                <MainLayout>
                  <SearchPage />
                </MainLayout>
              }
            />
            <Route
              path="/profile"
              element={
                <MainLayout>
                  <ProfilePage />
                </MainLayout>
              }
            />
            <Route
              path="/login"
              element={
                <MainLayout>
                  <LoginPage />
                </MainLayout>
              }
            />

            {/* Blog */}
            <Route
              path="/blog"
              element={
                <MainLayout>
                  <BlogListPage />
                </MainLayout>
              }
            />
            <Route
              path="/blog/:slug"
              element={
                <MainLayout>
                  <BlogDetailPage />
                </MainLayout>
              }
            />

            {/* Static informational pages */}
            <Route
              path="/about"
              element={
                <MainLayout>
                  <AboutPage />
                </MainLayout>
              }
            />
            <Route
              path="/contact"
              element={
                <MainLayout>
                  <ContactPage />
                </MainLayout>
              }
            />
            <Route
              path="/admin"
              element={
                <MainLayout>
                  <AdminPage />
                </MainLayout>
              }
            />

            {/* 6 Sections Portals */}
            <Route
              path="/academy"
              element={
                <MainLayout>
                  <SectionListPage explicitSection="academy" />
                </MainLayout>
              }
            />
            <Route
              path="/toolbox"
              element={
                <MainLayout>
                  <SectionListPage explicitSection="toolbox" />
                </MainLayout>
              }
            />
            <Route
              path="/library"
              element={
                <MainLayout>
                  <SectionListPage explicitSection="library" />
                </MainLayout>
              }
            />
            <Route
              path="/journey"
              element={
                <MainLayout>
                  <SectionListPage explicitSection="journey" />
                </MainLayout>
              }
            />
            <Route
              path="/gathering"
              element={
                <MainLayout>
                  <SectionListPage explicitSection="gathering" />
                </MainLayout>
              }
            />
            <Route
              path="/spark"
              element={
                <MainLayout>
                  <SectionListPage explicitSection="spark" />
                </MainLayout>
              }
            />

            {/* Content Detail Page */}
            <Route
              path="/:sectionSlug/:slug"
              element={
                <MainLayout>
                  <ContentDetailPage />
                </MainLayout>
              }
            />

            {/* Catch-all 404 Fallback */}
            <Route
              path="*"
              element={
                <MainLayout>
                  <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <h2 className="text-4xl font-black text-ink-900">۴۰۴</h2>
                    <p className="text-sm text-ink-500">صفحه مورد نظر شما در نوآفر یافت نشد.</p>
                    <a
                      href="/"
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      بازگشت به صفحه اصلی
                    </a>
                  </div>
                </MainLayout>
              }
            />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
