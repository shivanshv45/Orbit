import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Video, VideoOff } from 'lucide-react';
import { CameraFeedback } from '@/components/teaching/CameraFeedback';
import { TopicNavigator } from '@/components/layout/TopicNavigator';
import { ProgressIndicator } from '@/components/layout/ProgressIndicator';
import { TeachingCanvas } from '@/components/teaching/TeachingCanvas';
import { useCurriculum } from '@/hooks/useCurriculum';
import { useTeachingContent } from '@/hooks/useTeachingContent';
import { useFaceTracking } from '@/hooks/useFaceTracking';
import { createOrGetUser } from '@/logic/userSession';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Module, Subtopic } from '@/types/curriculum';
import { useUser } from '@clerk/clerk-react';

export default function LearnPage() {
  const navigate = useNavigate();
  const { subtopicId } = useParams<{ subtopicId: string }>();
  const [currentSubtopicId, setCurrentSubtopicId] = useState(subtopicId || '');
  const [progressPanelOpen, setProgressPanelOpen] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const { user } = useUser();
  const { uid } = createOrGetUser(user ? { id: user.id, fullName: user.fullName } : null);
  // const queryClient = useQueryClient(); // Not using queryClient directly right now, preventing error. 
  // Actually, wait, line 65 uses queryClient.prefetchQuery. So I need to import useQueryClient again.
  const queryClient = useQueryClient();

  const { data: curriculumData, isLoading: curriculumLoading } = useCurriculum();
  const { data: teachingData, isLoading: teachingLoading, error } = useTeachingContent(currentSubtopicId);

  // Face tracking hook
  const { isActive: cameraActive, currentMetrics } = useFaceTracking(currentSubtopicId, cameraEnabled);

  // Log metrics for debugging
  useEffect(() => {
    if (cameraEnabled && currentMetrics) {
      console.debug('[Camera Metrics]', currentMetrics);
    }
  }, [cameraEnabled, currentMetrics]);

  // Calculate Stats locally from curriculum data
  const calculateStreak = () => {
    try {
      const stored = localStorage.getItem('orbit_streak_data');
      const today = new Date().toISOString().split('T')[0];

      if (!stored) {
        localStorage.setItem('orbit_streak_data', JSON.stringify({ count: 1, lastDate: today }));
        return 1;
      }

      const { count, lastDate } = JSON.parse(stored);

      if (lastDate === today) return count;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastDate === yesterdayStr) {
        const newCount = count + 1;
        localStorage.setItem('orbit_streak_data', JSON.stringify({ count: newCount, lastDate: today }));
        return newCount;
      } else {
        // Streak broken
        localStorage.setItem('orbit_streak_data', JSON.stringify({ count: 1, lastDate: today }));
        return 1;
      }
    } catch (e) {
      console.error("Streak calc error", e);
      return 0;
    }
  };

  const streak = calculateStreak();

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
    // Invalidate curriculum query to update stats immediately
    queryClient.invalidateQueries({ queryKey: ['curriculum'] });

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
  // Calculate some stats for progress panel
  const completedSubtopicsFiltered = allSubtopics.filter((s: Subtopic) => s.status === 'completed');
  const lessonsCompleted = completedSubtopicsFiltered.length;
  const totalLessons = allSubtopics.length;

  const avgPracticeScore = completedSubtopicsFiltered.length > 0
    ? Math.round(completedSubtopicsFiltered.reduce((acc: number, curr: Subtopic) => acc + (curr.score || 0), 0) / completedSubtopicsFiltered.length)
    : 0;

  const remainingLessons = totalLessons - lessonsCompleted;
  const estimatedMinutes = remainingLessons * 15;
  const estimatedHours = Math.floor(estimatedMinutes / 60);
  const estimatedMins = estimatedMinutes % 60;
  const estimatedTimeLeft = estimatedHours > 0 ? `${estimatedHours}h ${estimatedMins}m` : `${estimatedMins}m`;

  const nextMilestoneTitle = allSubtopics.find((s: Subtopic) => s.status !== 'completed')?.title || "All Complete!";

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
      <main className="flex-1 overflow-y-auto relative">
        {/* Camera Toggle - Fixed Below Sidebar Toggle */}
        <div className="fixed top-16 right-4 z-40 flex flex-col items-end gap-3">
          <button
            onClick={() => setCameraEnabled(!cameraEnabled)}
            className="p-2 rounded-xl bg-background border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 shadow-sm hover:shadow-md"
            title={cameraEnabled ? "Disable Focus Tracking" : "Enable Focus Tracking"}
          >
            {cameraEnabled ? (
              <Video className="w-5 h-5 text-primary" />
            ) : (
              <VideoOff className="w-5 h-5" />
            )}
          </button>

          {cameraEnabled && cameraActive && currentMetrics && (
            <CameraFeedback metrics={currentMetrics} expanded={true} />
          )}
        </div>

        <div className="max-w-3xl mx-auto p-8 pr-16 pt-16">
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
        streak={streak}
        lessonsCompleted={lessonsCompleted}
        totalLessons={totalLessons}
        practiceScore={avgPracticeScore}
        estimatedTimeLeft={estimatedTimeLeft}
        nextMilestone={nextMilestoneTitle}
        isOpen={progressPanelOpen}
        onToggle={() => setProgressPanelOpen(!progressPanelOpen)}
      />
    </div>
  );
}
