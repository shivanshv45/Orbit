import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { FileUploader } from '@/components/upload/FileUploader';
import { CurriculumListModal } from '@/components/curriculum/CurriculumListModal';
import { useCurriculums } from '@/hooks/useCurriculums';
import { SolarSystemBackground } from '@/components/landing/SolarSystemBackground';
import { FutureOfStudySection } from '@/components/landing/FutureOfStudySection';
import { AuthButton } from '@/components/auth/AuthButton';
import { OrbitLogo } from '@/components/brand/OrbitLogo';
import { useAccessibilityModeOptional } from '@/context/AccessibilityModeContext';

const BASE_SCALE = 0.3;

const fontStyles = [
  { fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: '10rem', letterSpacing: '0.08em' },
  { fontFamily: "'DM Sans', sans-serif", fontWeight: 900, fontSize: '11.5rem', letterSpacing: '0.1em' },
  { fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '4.5rem', letterSpacing: '0.22em' },
  { fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: '12.2rem', letterSpacing: '0.9em' },
  { fontFamily: "'DM Sans', sans-serif", fontWeight: 900, fontSize: '11.5rem', letterSpacing: '0.21em' },
];

const animationSequence = [
  [0, 0, 0, 0, 0],
  [1, 0, 0, 0, 0],
  [1, 1, 0, 0, 0],
  [2, 1, 1, 0, 0],
  [2, 2, 1, 1, 0],
  [3, 2, 2, 1, 1],
  [3, 3, 2, 2, 1],
  [4, 3, 3, 2, 2],
  [4, 4, 3, 3, 2],
  [4, 4, 4, 3, 3],
  [4, 4, 4, 4, 3],
  [4, 4, 4, 4, 4],
  [3, 4, 4, 4, 4],
  [2, 3, 4, 4, 4],
  [1, 2, 3, 4, 4],
  [0, 1, 2, 3, 4],
  [0, 0, 1, 2, 3],
  [0, 0, 0, 1, 2],
  [0, 0, 0, 0, 1],
  [0, 0, 0, 0, 0],
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [showUploader, setShowUploader] = useState(false);
  const [showCurriculumModal, setShowCurriculumModal] = useState(false);
  const [showAnimation, setShowAnimation] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const accessibility = useAccessibilityModeOptional();

  // Prefetch curriculums on page load for instant modal display
  useCurriculums();

  // Voice command handler for landing page
  const handleVoiceCommand = useCallback((text: string): boolean => {
    const lower = text.toLowerCase();

    // Open curriculum modal
    if (lower.includes('curriculum') || lower.includes('courses') || lower.includes('my courses')) {
      accessibility?.speak?.('Opening your courses');
      setTimeout(() => setShowCurriculumModal(true), 800);
      return true;
    }

    // Open uploader
    if (lower.includes('upload') || lower.includes('new') || lower.includes('start') || lower.includes('learn')) {
      accessibility?.speak?.('Opening upload');
      setTimeout(() => setShowUploader(true), 800);
      return true;
    }

    return false;
  }, [accessibility]);

  // Set command handler when on landing page in voice mode
  useEffect(() => {
    if (accessibility?.isOn && !showCurriculumModal && showContent) {
      accessibility.setCommandHandler?.(handleVoiceCommand);
      return () => accessibility.setCommandHandler?.(null);
    }
  }, [accessibility?.isOn, showCurriculumModal, showContent, handleVoiceCommand, accessibility]);

  useEffect(() => {
    const styleInterval = setInterval(() => {
      setAnimationStep(prev => {
        const nextStep = prev + 1;
        if (nextStep >= animationSequence.length) {
          return prev;
        }
        return nextStep;
      });
    }, 150);

    const animationTimeout = setTimeout(() => {
      clearInterval(styleInterval);
      setShowAnimation(false);
      setTimeout(() => {
        setShowContent(true);
      }, 300);
    }, animationSequence.length * 150 + 500);

    return () => {
      clearInterval(styleInterval);
      clearTimeout(animationTimeout);
    };
  }, []);

  const handleFilesReady = () => {
    navigate('/curriculum');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <AnimatePresence>
        {showAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-background flex items-center justify-center select-none"
          >
            <motion.div
              style={{ scale: BASE_SCALE }} className="flex items-center justify-center gap-3">
              {['O', 'R', 'B', 'I', 'T'].map((letter, index) => {
                const styleIndex = animationSequence[animationStep]?.[index] ?? 0;
                const currentStyle = fontStyles[styleIndex];
                return (
                  <motion.span
                    key={index}
                    animate={currentStyle}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    style={{
                      fontFamily: currentStyle.fontFamily,
                      fontWeight: currentStyle.fontWeight,
                      fontSize: currentStyle.fontSize,
                      letterSpacing: currentStyle.letterSpacing,
                      WebkitFontSmoothing: 'antialiased',
                      MozOsxFontSmoothing: 'grayscale',
                      textRendering: 'optimizeLegibility',
                      fontFeatureSettings: 'normal',
                    }}
                    className="text-primary"
                  >
                    {letter}
                  </motion.span>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ clipPath: 'inset(100% 0 0 0)' }}
            animate={{ clipPath: 'inset(0% 0 0 0)' }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="w-full"
          >
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
              <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                <OrbitLogo />

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowCurriculumModal(true)}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Your Curriculums
                  </button>
                  <AuthButton />
                </div>
              </div>
            </header>

            <main className="pt-16 relative">
              <SolarSystemBackground />

              {/* Hero Section */}
              <section className="relative overflow-hidden">
                <div className="container mx-auto px-6 py-24 lg:py-32">
                  <div className="max-w-3xl mx-auto text-center relative z-10">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                    >
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium mb-6 backdrop-blur-sm">
                        <Sparkles className="w-4 h-4" />
                        Shut up and Learn
                      </span>
                    </motion.div>

                    <motion.h1
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-foreground leading-tight mb-6"
                    >
                      Everything you need to learn.
                      <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">Nothing else.</span>
                    </motion.h1>

                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="text-lg text-muted-foreground/80 max-w-xl mx-auto mb-10"
                    >
                      Simply upload your materials. Orbit organizes them into interactive lessons, simulations, and quizzes, adapting to your pace so you can focus on truly understanding.
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    >
                      <button
                        onClick={() => setShowUploader(true)}
                        className="inline-flex items-center justify-center h-14 px-8 rounded-2xl bg-primary text-primary-foreground text-lg font-medium shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] hover:scale-[1.02] transition-all duration-300"
                      >
                        Start Learning Now
                      </button>
                      <p className="text-sm text-muted-foreground mt-4">
                        No account needed. Just upload and learn.
                      </p>
                    </motion.div>
                  </div>
                </div>
              </section>

              {/* Upload Modal */}
              {showUploader && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-2xl my-auto"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-2xl font-semibold text-foreground">Upload your materials</h2>
                        <p className="text-muted-foreground mt-1">
                          Orbit will analyze and structure your learning path
                        </p>
                      </div>
                      <button
                        onClick={() => setShowUploader(false)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <span className="sr-only">Close</span>
                        ✕
                      </button>
                    </div>

                    <FileUploader onUploadComplete={handleFilesReady} />
                  </motion.div>
                </motion.div>
              )}

              {/* Features Section - Animated Planet Path */}
              <FutureOfStudySection />
            </main>

            {/* Footer */}
            <footer className="relative py-12">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground text-center md:text-left">
                      Built for focused, guided learning.
                    </p>
                  </div>
                  <div className="flex-1 flex justify-center">
                    <button
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors hover:scale-105 active:scale-95"
                    >
                      Back to Top
                    </button>
                  </div>
                  <div className="flex items-center gap-6 justify-end flex-1">
                    <span className="hidden md:inline-flex text-xs text-muted-foreground/60 items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-md border border-border/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-pulse"></span>
                      Press <kbd className="font-sans font-semibold text-primary">Ctrl</kbd> + <kbd className="font-sans font-semibold text-primary">Space</kbd> for accessibility
                    </span>
                  </div>
                </div>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Curriculum List Modal */}
      <CurriculumListModal
        isOpen={showCurriculumModal}
        onClose={() => setShowCurriculumModal(false)}
      />
    </div>
  );
}
