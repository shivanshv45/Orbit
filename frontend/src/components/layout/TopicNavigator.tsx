import { motion } from 'framer-motion';
import { Check, Play, Lock, ChevronLeft, CircleDot, Beaker, Brain, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Module, Subtopic } from '@/data/mockCurriculum';

const subtopicIcons = {
  lesson: CircleDot,
  simulation: Beaker,
  practice: Brain,
  recall: Sparkles,
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
            <span className="font-medium text-sidebar-foreground">{module.progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-sidebar-accent overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${module.progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full rounded-full bg-progress-gradient"
            />
          </div>
        </div>
      </div>

      {/* Topics List */}
      <div className="flex-1 overflow-y-auto py-2">
        {module.topics.map((topic, topicIndex) => {
          const isTopicLocked = topic.status === 'locked';
          const isTopicCompleted = topic.status === 'completed';

          return (
            <div key={topic.id} className="px-3 py-2">
              {/* Topic Header */}
              <div className="flex items-center gap-2 mb-2 px-2">
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium",
                  isTopicCompleted && "bg-complete text-complete-foreground",
                  topic.status === 'in-progress' && "bg-primary text-primary-foreground",
                  isTopicLocked && "bg-sidebar-accent text-muted-foreground"
                )}>
                  {isTopicCompleted ? (
                    <Check className="w-3 h-3" />
                  ) : isTopicLocked ? (
                    <Lock className="w-3 h-3" />
                  ) : (
                    topicIndex + 1
                  )}
                </div>
                <span className={cn(
                  "text-sm font-medium truncate",
                  isTopicLocked ? "text-muted-foreground" : "text-sidebar-foreground"
                )}>
                  {topic.title}
                </span>
              </div>

              {/* Subtopics */}
              <div className="space-y-0.5 ml-2">
                {topic.subtopics.map((subtopic) => (
                  <SubtopicButton
                    key={subtopic.id}
                    subtopic={subtopic}
                    isCurrent={currentSubtopicId === subtopic.id}
                    onClick={() => onSelectSubtopic(subtopic.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
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
  const Icon = subtopicIcons[subtopic.type];
  const isLocked = subtopic.status === 'locked';
  const isCompleted = subtopic.status === 'completed';
  const isAvailable = subtopic.status === 'available' || subtopic.status === 'in-progress';

  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={cn(
        "w-full px-3 py-2 rounded-lg flex items-center gap-2.5 text-left transition-all duration-200 group",
        isCurrent && "bg-sidebar-accent",
        !isCurrent && isAvailable && "hover:bg-sidebar-accent/50",
        isLocked && "opacity-40 cursor-not-allowed"
      )}
    >
      {/* Icon */}
      <div className={cn(
        "w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0",
        subtopic.type === 'simulation' && "bg-primary/10",
        subtopic.type === 'practice' && "bg-practice/10",
        subtopic.type === 'recall' && "bg-success/10",
        subtopic.type === 'lesson' && "bg-sidebar-accent"
      )}>
        <Icon className={cn(
          "w-3.5 h-3.5",
          subtopic.type === 'simulation' && "text-primary",
          subtopic.type === 'practice' && "text-practice",
          subtopic.type === 'recall' && "text-success",
          subtopic.type === 'lesson' && "text-muted-foreground"
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
