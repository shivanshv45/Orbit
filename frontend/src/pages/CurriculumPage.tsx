import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { CurriculumTree } from '@/components/curriculum/CurriculumTree';
import { useCurriculum } from '@/hooks/useCurriculum';
import type { Module, Subtopic } from '@/types/curriculum';
import { OrbitLogo } from '@/components/brand/OrbitLogo';

export default function CurriculumPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const curriculumId = searchParams.get('id') || undefined;
  const { data, isLoading, error } = useCurriculum(curriculumId);

  const handleStartLesson = (subtopicId: string) => {
    navigate(`/learn/${subtopicId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your curriculum...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-foreground mb-4">Failed to load curriculum</p>
          <p className="text-muted-foreground text-sm mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const modules: Module[] = data?.modules || [];
  const firstAvailableSubtopic: Subtopic | undefined = modules
    .flatMap((m: Module) => m.subtopics)
    .find((s: Subtopic) => s.status !== 'completed');

  const allSubtopics = modules.flatMap((m: Module) => m.subtopics);
  const completedSubtopics = allSubtopics.filter((s: Subtopic) => s.status === 'completed');
  const isFullyComplete = allSubtopics.length > 0 && completedSubtopics.length === allSubtopics.length;
  const completionPercentage = allSubtopics.length > 0
    ? Math.round((completedSubtopics.length / allSubtopics.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <OrbitLogo size="sm" />
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        {modules.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 p-6 rounded-2xl border ${isFullyComplete
              ? 'bg-complete/10 border-complete/30'
              : 'bg-accent/50 border-primary/20'
              }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isFullyComplete
                ? 'bg-complete/20'
                : 'bg-primary/20'
                }`}>
                {isFullyComplete ? (
                  <svg className="w-6 h-6 text-complete" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                {isFullyComplete ? (
                  <>
                    <h2 className="font-medium text-complete mb-1">🎉 Congratulations!</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      You've completed all {allSubtopics.length} lessons in this curriculum.
                      Amazing work! Feel free to review any topic or upload new materials to continue learning.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="font-medium text-foreground mb-1">Ready to learn?</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your study materials have been organized into {modules.length} module{modules.length !== 1 ? 's' : ''} with {allSubtopics.length} lesson{allSubtopics.length !== 1 ? 's' : ''}.
                      {completionPercentage > 0 && ` You're ${completionPercentage}% complete!`}
                    </p>
                  </>
                )}
                {firstAvailableSubtopic && (
                  <button
                    onClick={() => handleStartLesson(firstAvailableSubtopic.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Continue learning
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        <CurriculumTree
          modules={modules}
          onStartLesson={handleStartLesson}
        />
      </main>
    </div>
  );
}
