import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, BookOpen, Brain, Zap } from 'lucide-react';
import { FileUploader } from '@/components/upload/FileUploader';
import { CurriculumListModal } from '@/components/curriculum/CurriculumListModal';
import { useCurriculums } from '@/hooks/useCurriculums';
import { SolarSystemBackground } from '@/components/landing/SolarSystemBackground';
import { AuthButton } from '@/components/auth/AuthButton';
import { OrbitLogo } from '@/components/brand/OrbitLogo';
const BASE_SCALE = 0.3;
const features = [
  {
    icon: Sparkles,
    title: 'Instant Structure',
    description: 'Raw documents become organized, bite-sized learning modules instantly',
  },
  {
    icon: BookOpen,
    title: 'Adaptive Pacing',
    description: 'Content that evolves with your understanding, moving at your speed',
  },
  {
    icon: Brain,
    title: 'Smart Retention',
    description: 'Practice exactly what you need to review, right when it matters',
  },
  {
    icon: Zap,
    title: 'Interactive Visuals',
    description: 'Grasp complex concepts through dynamic, hands-on simulations',
  },
];

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

  // Prefetch curriculums on page load for instant modal display
  useCurriculums();

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
                        AI-Guided Learning
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

              {/* Features Section */}
              <section className="py-24 bg-muted/30">
                <div className="container mx-auto px-6">
                  <div className="text-center mb-16">
                    <h2 className="text-3xl font-semibold text-foreground mb-4">
                      The future of study
                    </h2>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                      Stop scrolling through static PDFs. Start interacting with ideas.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                    {features.map((feature, index) => (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                          <feature.icon className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-medium text-foreground mb-2">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* CTA Section */}
              <section className="py-24">
                <div className="container mx-auto px-6">
                  <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-3xl font-semibold text-foreground mb-4">
                      Ready to learn smarter?
                    </h2>
                    <p className="text-muted-foreground mb-8">
                      Upload your study materials and let Orbit create your personalized learning experience.
                    </p>
                    <button
                      onClick={() => setShowUploader(true)}
                      className="inline-flex items-center justify-center h-12 px-6 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                    >
                      Get Started Free
                    </button>
                  </div>
                </div>
              </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-border py-8">
              <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
                <p>Built for focused, guided learning.</p>
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
