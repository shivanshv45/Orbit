import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TopicNavigator } from '@/components/layout/TopicNavigator';
import { ProgressIndicator } from '@/components/layout/ProgressIndicator';
import { TeachingCanvas } from '@/components/teaching/TeachingCanvas';
import { PracticeQuestion } from '@/components/practice/PracticeQuestion';
import { mockCourse, practiceQuestions } from '@/data/mockCurriculum';

export default function LearnPage() {
  const navigate = useNavigate();
  const { subtopicId } = useParams<{ subtopicId: string }>();
  const [currentSubtopicId, setCurrentSubtopicId] = useState(subtopicId || 'sub-2-2-1');
  const [showPractice, setShowPractice] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [progressPanelOpen, setProgressPanelOpen] = useState(false);

  // Update current subtopic when URL changes
  useEffect(() => {
    if (subtopicId) {
      setCurrentSubtopicId(subtopicId);
    }
  }, [subtopicId]);

  // Find current module
  const currentModule = mockCourse.modules.find(m => 
    m.topics.some(t => t.subtopics.some(s => s.id === currentSubtopicId))
  ) || mockCourse.modules[1];

  const handleSelectSubtopic = (id: string) => {
    // Check if it's available
    const subtopic = currentModule.topics
      .flatMap(t => t.subtopics)
      .find(s => s.id === id);
    
    if (subtopic && subtopic.status !== 'locked') {
      setCurrentSubtopicId(id);
      setShowPractice(false);
      navigate(`/learn/${id}`, { replace: true });
    }
  };

  const handleNext = () => {
    // Get all subtopics in order
    const allSubtopics = currentModule.topics.flatMap(t => t.subtopics);
    const currentIndex = allSubtopics.findIndex(s => s.id === currentSubtopicId);
    
    // If this was the simulation, show practice
    if (currentSubtopicId === 'sub-2-2-2' && !showPractice) {
      setShowPractice(true);
      return;
    }

    // Move to next subtopic
    if (currentIndex < allSubtopics.length - 1) {
      const nextSubtopic = allSubtopics[currentIndex + 1];
      if (nextSubtopic.status !== 'locked') {
        handleSelectSubtopic(nextSubtopic.id);
      }
    }
  };

  const handlePracticeComplete = (correct: boolean) => {
    if (currentQuestionIndex < practiceQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // All questions done, move to next lesson
      setShowPractice(false);
      setCurrentQuestionIndex(0);
      handleNext();
    }
  };

  const handleBack = () => {
    navigate('/curriculum');
  };

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
          {showPractice ? (
            <motion.div
              key="practice"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="mb-8">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-practice/10 text-practice text-sm font-medium">
                  Practice Time
                </span>
              </div>
              <PracticeQuestion
                question={practiceQuestions[currentQuestionIndex]}
                onComplete={handlePracticeComplete}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={practiceQuestions.length}
              />
            </motion.div>
          ) : (
            <motion.div
              key={currentSubtopicId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <TeachingCanvas
                subtopicId={currentSubtopicId}
                onNext={handleNext}
                onPrevious={() => {}}
                isFirst={false}
                isLast={false}
              />
            </motion.div>
          )}
        </div>
      </main>

      {/* Right Sidebar - Progress (Toggleable) */}
      <ProgressIndicator
        streak={3}
        lessonsCompleted={8}
        totalLessons={22}
        practiceScore={85}
        estimatedTimeLeft="2h 15m"
        isOpen={progressPanelOpen}
        onToggle={() => setProgressPanelOpen(!progressPanelOpen)}
      />
    </div>
  );
}
