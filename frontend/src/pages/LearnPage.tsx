import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { TopicNavigator } from '@/components/layout/TopicNavigator';
import { ProgressIndicator } from '@/components/layout/ProgressIndicator';
import { TeachingCanvas } from '@/components/teaching/TeachingCanvas';
import { useCurriculum } from '@/hooks/useCurriculum';
import { useTeachingContent } from '@/hooks/useTeachingContent';
import { createOrGetUser } from '@/logic/userSession';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Module, Subtopic } from '@/types/curriculum';

export default function LearnPage() {
  const navigate = useNavigate();
  const { subtopicId } = useParams<{ subtopicId: string }>();
  const [currentSubtopicId, setCurrentSubtopicId] = useState(subtopicId || '');
  const [progressPanelOpen, setProgressPanelOpen] = useState(false);
  const { uid } = createOrGetUser();
  const queryClient = useQueryClient();

  const { data: curriculumData, isLoading: curriculumLoading } = useCurriculum();
  const { data: teachingData, isLoading: teachingLoading, error } = useTeachingContent(currentSubtopicId);

  // Update current subtopic when URL changes
  useEffect(() => {
    if (subtopicId) {
      setCurrentSubtopicId(subtopicId);
    }
  }, [subtopicId]);

  // Find current module based on which module contains the current subtopic
  const currentModule = curriculumData?.modules.find((m: Module) =>
    m.subtopics.some((s: Subtopic) => s.id === currentSubtopicId)
  ) || curriculumData?.modules[0];

  // Get all subtopics for navigation
  const allSubtopics: Subtopic[] = curriculumData?.modules.flatMap((m: Module) => m.subtopics) || [];
  const currentIndex = allSubtopics.findIndex((s: Subtopic) => s.id === currentSubtopicId);
  const nextSubtopic = currentIndex >= 0 && currentIndex < allSubtopics.length - 1
    ? allSubtopics[currentIndex + 1]
    : null;

  // Prefetch next subtopic
  useEffect(() => {
    if (nextSubtopic && nextSubtopic.id) {
      queryClient.prefetchQuery({
        queryKey: ['teaching', nextSubtopic.id],
        queryFn: () => api.getTeachingContent(nextSubtopic.id, uid),
        staleTime: Infinity,
      });
    }
  }, [nextSubtopic, queryClient, uid]);

  const handleSelectSubtopic = (id: string) => {
    setCurrentSubtopicId(id);
    navigate(`/learn/${id}`, { replace: true });
  };

  const handleNext = () => {
    if (nextSubtopic) {
      handleSelectSubtopic(nextSubtopic.id);
    } else {
      navigate('/curriculum');
    }
  };

  const handleBack = () => {
    navigate('/curriculum');
  };

  // Calculate some stats for progress panel
  const completedSubtopics = allSubtopics.filter((s: Subtopic) => s.status === 'completed').length;
  const totalSubtopics = allSubtopics.length;

  if (curriculumLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-foreground text-lg font-medium">Loading curriculum...</p>
        </div>
      </div>
    );
  }

  if (!currentModule || !currentSubtopicId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-foreground text-lg font-medium mb-2">No content available</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Back to Curriculum
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen bg-background flex overflow-hidden">
      {/* Left Sidebar - Topic Navigator */}
      <TopicNavigator
        module={currentModule}
        currentSubtopicId={currentSubtopicId}
        onSelectSubtopic={handleSelectSubtopic}
        onBack={handleBack}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-8 pr-16">
          {teachingLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-foreground text-lg font-medium">Generating your personalized lesson...</p>
                <p className="text-muted-foreground text-sm mt-2">This may take a few moments</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center max-w-md">
                <p className="text-foreground text-lg font-medium mb-2">Failed to load teaching content</p>
                <p className="text-muted-foreground text-sm mb-4">{error.message}</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Retry
                  </button>
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors"
                  >
                    Back to Curriculum
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <motion.div
              key={currentSubtopicId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <TeachingCanvas
                blocks={teachingData?.blocks || []}
                subtopicId={currentSubtopicId}
                onNext={handleNext}
                hasNext={!!nextSubtopic}
              />
            </motion.div>
          )}
        </div>
      </main>

      {/* Right Sidebar - Progress (Toggleable) */}
      <ProgressIndicator
        streak={3}
        lessonsCompleted={completedSubtopics}
        totalLessons={totalSubtopics}
        practiceScore={85}
        estimatedTimeLeft="2h 15m"
        isOpen={progressPanelOpen}
        onToggle={() => setProgressPanelOpen(!progressPanelOpen)}
      />
    </div>
  );
}
