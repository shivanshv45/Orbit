import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, ArrowRight, Loader2 } from 'lucide-react';
import { CurriculumTree } from '@/components/curriculum/CurriculumTree';
import { useCurriculum } from '@/hooks/useCurriculum';
import type { Module, Subtopic } from '@/types/curriculum';

export default function CurriculumPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useCurriculum();

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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">ORBIT</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        {modules.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 rounded-2xl bg-accent/50 border border-primary/20"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="font-medium text-foreground mb-1">Your learning path is ready</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  The AI has analyzed your materials and created a structured curriculum.
                  Topics are unlocked as you progress.
                </p>
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
