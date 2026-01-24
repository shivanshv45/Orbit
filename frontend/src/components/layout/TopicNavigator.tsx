import { motion } from 'framer-motion';
import { Check, Play, ChevronLeft, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Module, Subtopic } from '@/types/curriculum';

const getScoreColor = (score: number) => {
  if (score === 0) return 'bg-muted';
  if (score <= 40) return 'bg-destructive/20';
  if (score <= 70) return 'bg-yellow-500/20';
  return 'bg-complete/20';
};

const getScoreDotColor = (score: number) => {
  if (score === 0) return 'text-muted-foreground';
  if (score <= 40) return 'text-destructive';
  if (score <= 70) return 'text-yellow-600';
  return 'text-complete';
};

interface TopicNavigatorProps {
  module: Module;
  currentSubtopicId: string;
  onSelectSubtopic: (id: string) => void;
  onBack: () => void;
}

export function TopicNavigator({
  module,
  currentSubtopicId,
  onSelectSubtopic,
  onBack
}: TopicNavigatorProps) {
  const completedCount = module.subtopics.filter(s => s.status === 'completed').length;
  const progress = Math.round((completedCount / module.subtopics.length) * 100);

  return (
    <div className="w-72 h-full border-r border-border bg-sidebar flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to curriculum
        </button>
        <h2 className="font-medium text-sidebar-foreground">{module.title}</h2>

        {/* Progress */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-sidebar-foreground">{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-sidebar-accent overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full rounded-full bg-progress-gradient"
            />
          </div>
        </div>
      </div>

      {/* Subtopics List */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-3 py-2">
          {/* Section Header */}
          <div className="flex items-center gap-2 mb-2 px-2">
            <span className="text-sm font-medium text-sidebar-foreground">
              Lessons
            </span>
          </div>

          {/* Subtopics */}
          <div className="space-y-0.5 ml-2">
            {module.subtopics.map((subtopic) => (
              <SubtopicButton
                key={subtopic.id}
                subtopic={subtopic}
                isCurrent={currentSubtopicId === subtopic.id}
                onClick={() => onSelectSubtopic(subtopic.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SubtopicButtonProps {
  subtopic: Subtopic;
  isCurrent: boolean;
  onClick: () => void;
}

function SubtopicButton({ subtopic, isCurrent, onClick }: SubtopicButtonProps) {
  const isCompleted = subtopic.status === 'completed';
  const isAvailable = subtopic.status === 'available' || subtopic.status === 'in-progress';

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full px-3 py-2 rounded-lg flex items-center gap-2.5 text-left transition-all duration-200 group",
        isCurrent && "bg-sidebar-accent",
        !isCurrent && isAvailable && "hover:bg-sidebar-accent/50"
      )}
    >
      {/* Icon with score indicator */}
      <div className={cn(
        "w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0",
        getScoreColor(subtopic.score)
      )}>
        <CircleDot className={cn(
          "w-3.5 h-3.5",
          getScoreDotColor(subtopic.score)
        )} />
      </div>

      {/* Text */}
      <span className={cn(
        "text-sm truncate flex-1",
        isCurrent && "text-sidebar-foreground font-medium",
        isCompleted && !isCurrent && "text-muted-foreground",
        isAvailable && !isCurrent && "text-sidebar-foreground"
      )}>
        {subtopic.title}
      </span>

      {/* Status indicator */}
      {isCompleted && (
        <Check className="w-3.5 h-3.5 text-complete flex-shrink-0" />
      )}
      {isCurrent && !isCompleted && (
        <Play className="w-3.5 h-3.5 text-primary flex-shrink-0" />
      )}
    </button>
  );
}
