import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, ArrowRight } from 'lucide-react';
import { CurriculumTree } from '@/components/curriculum/CurriculumTree';
import { mockCourse } from '@/data/mockCurriculum';

export default function CurriculumPage() {
  const navigate = useNavigate();

  const handleStartLesson = (subtopicId: string) => {
    navigate(`/learn/${subtopicId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
        {/* Course Ready Banner */}
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
              <button
                onClick={() => handleStartLesson('sub-2-2-2')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Continue where you left off
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Curriculum Tree */}
        <CurriculumTree 
          course={mockCourse} 
          onStartLesson={handleStartLesson}
        />
      </main>
    </div>
  );
}
