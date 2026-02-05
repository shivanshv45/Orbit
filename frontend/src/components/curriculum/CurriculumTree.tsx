import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Lock, Play } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Module, Subtopic } from '@/types/curriculum';

interface CurriculumTreeProps {
  modules: Module[];
  onStartLesson: (subtopicId: string) => void;
}

export function CurriculumTree({ modules, onStartLesson }: CurriculumTreeProps) {
  const [expandedModules, setExpandedModules] = useState<string[]>(
    modules.length > 0 ? [modules[0].id] : []
  );

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev =>
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
  };

  return (
    <div className="space-y-4">
      {modules.map((module, moduleIndex) => (
        <ModuleCard
          key={module.id}
          module={module}
          index={moduleIndex}
          isExpanded={expandedModules.includes(module.id)}
          onToggle={() => toggleModule(module.id)}
          onStartLesson={onStartLesson}
        />
      ))}
    </div>
  );
}

interface ModuleCardProps {
  module: Module;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onStartLesson: (subtopicId: string) => void;
}

function ModuleCard({ module, index, isExpanded, onToggle, onStartLesson }: ModuleCardProps) {
  const hasCompletedSubtopics = module.subtopics.some(s => s.status === 'completed');
  const hasInProgressSubtopics = module.subtopics.some(s => s.status === 'in-progress');
  const isLocked = module.subtopics.every(s => s.status === 'locked');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "rounded-2xl border transition-all duration-300",
        isLocked ? "bg-muted/30 border-border/50" : "bg-card border-border",
        hasInProgressSubtopics && "ring-2 ring-primary/20"
      )}
    >
      <button
        onClick={onToggle}
        disabled={isLocked}
        className={cn(
          "w-full p-5 flex items-center gap-4 text-left",
          isLocked && "cursor-not-allowed opacity-60"
        )}
      >
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-xl transition-colors",
          hasCompletedSubtopics && "bg-complete/10",
          hasInProgressSubtopics && "bg-primary/10",
          isLocked && "bg-muted"
        )}>
          {hasCompletedSubtopics && <Check className="w-5 h-5 text-complete" />}
          {hasInProgressSubtopics && !hasCompletedSubtopics && <Play className="w-5 h-5 text-primary" />}
          {isLocked && <Lock className="w-5 h-5 text-muted-foreground" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Module {index + 1}
            </span>
            {hasInProgressSubtopics && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                In Progress
              </span>
            )}
          </div>
          <h3 className={cn(
            "font-medium truncate",
            isLocked ? "text-muted-foreground" : "text-foreground"
          )}>
            {module.title}
          </h3>
        </div>

        <div className="flex items-center gap-4">
          {!isLocked && (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </motion.div>
          )}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && !isLocked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-1">
              {module.subtopics.map((subtopic) => (
                <SubtopicItem
                  key={subtopic.id}
                  subtopic={subtopic}
                  onStart={() => onStartLesson(subtopic.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface SubtopicItemProps {
  subtopic: Subtopic;
  onStart: () => void;
}

function SubtopicItem({ subtopic, onStart }: SubtopicItemProps) {
  const isLocked = subtopic.status === 'locked';
  const isCompleted = subtopic.status === 'completed';
  const isInProgress = subtopic.status === 'in-progress';
  const isAvailable = subtopic.status === 'available';

  const getScoreColor = (score: number) => {
    if (score === 0) return 'gray';
    if (score <= 40) return 'red';
    if (score <= 70) return 'yellow';
    return 'green';
  };

  const scoreColor = getScoreColor(subtopic.score);

  return (
    <button
      onClick={onStart}
      disabled={isLocked}
      className={cn(
        "w-full p-3 rounded-lg flex items-center gap-3 text-left transition-all duration-200",
        isLocked && "opacity-40 cursor-not-allowed",
        (isAvailable || isInProgress) && "hover:bg-accent/50 cursor-pointer",
        isInProgress && "bg-accent/30"
      )}
    >
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center",
        scoreColor === 'gray' && "bg-muted",
        scoreColor === 'red' && "bg-red-500/20",
        scoreColor === 'yellow' && "bg-yellow-500/20",
        scoreColor === 'green' && "bg-green-500/20"
      )}>
        <div className={cn(
          "w-2 h-2 rounded-full",
          scoreColor === 'gray' && "bg-muted-foreground",
          scoreColor === 'red' && "bg-red-500",
          scoreColor === 'yellow' && "bg-yellow-500",
          scoreColor === 'green' && "bg-green-500"
        )} />
      </div>

      <div className="flex-1 min-w-0">
        <span className={cn(
          "text-sm truncate block",
          isCompleted && "text-muted-foreground line-through",
          isInProgress && "text-foreground font-medium",
          isAvailable && "text-foreground",
          isLocked && "text-muted-foreground"
        )}>
          {subtopic.title}
        </span>
        {subtopic.score > 0 && (
          <span className="text-xs text-muted-foreground ml-2">
            {subtopic.score}%
          </span>
        )}
      </div>

      {isCompleted && (
        <Check className="w-4 h-4 text-complete" />
      )}
      {isInProgress && (
        <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
          Continue
        </span>
      )}
      {isLocked && (
        <Lock className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
  );
}
