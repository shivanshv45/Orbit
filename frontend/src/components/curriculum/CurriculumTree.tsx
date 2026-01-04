import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Lock, Play, Sparkles, Beaker, Brain, CircleDot } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Course, Module, Topic, Subtopic } from '@/data/mockCurriculum';

const subtopicIcons = {
  lesson: CircleDot,
  simulation: Beaker,
  practice: Brain,
  recall: Sparkles,
};

interface CurriculumTreeProps {
  course: Course;
  onStartLesson: (subtopicId: string) => void;
}

export function CurriculumTree({ course, onStartLesson }: CurriculumTreeProps) {
  const [expandedModules, setExpandedModules] = useState<string[]>(
    course.modules.filter(m => m.status === 'in-progress').map(m => m.id)
  );
  const [expandedTopics, setExpandedTopics] = useState<string[]>(
    course.modules.flatMap(m => m.topics.filter(t => t.status === 'in-progress').map(t => t.id))
  );

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
  };

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => 
      prev.includes(topicId) ? prev.filter(id => id !== topicId) : [...prev, topicId]
    );
  };

  return (
    <div className="space-y-4">
      {/* Course Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-semibold text-foreground mb-2">{course.title}</h1>
        <p className="text-muted-foreground mb-4">{course.description}</p>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium text-foreground">{course.totalProgress}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${course.totalProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-progress-gradient"
            />
          </div>
        </div>
      </motion.div>

      {/* Modules */}
      <div className="space-y-3">
        {course.modules.map((module, moduleIndex) => (
          <ModuleCard
            key={module.id}
            module={module}
            index={moduleIndex}
            isExpanded={expandedModules.includes(module.id)}
            onToggle={() => toggleModule(module.id)}
            expandedTopics={expandedTopics}
            onToggleTopic={toggleTopic}
            onStartLesson={onStartLesson}
          />
        ))}
      </div>
    </div>
  );
}

interface ModuleCardProps {
  module: Module;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  expandedTopics: string[];
  onToggleTopic: (topicId: string) => void;
  onStartLesson: (subtopicId: string) => void;
}

function ModuleCard({ module, index, isExpanded, onToggle, expandedTopics, onToggleTopic, onStartLesson }: ModuleCardProps) {
  const isLocked = module.status === 'locked';
  const isCompleted = module.status === 'completed';
  const isInProgress = module.status === 'in-progress';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "rounded-2xl border transition-all duration-300",
        isLocked ? "bg-muted/30 border-border/50" : "bg-card border-border",
        isInProgress && "ring-2 ring-primary/20"
      )}
    >
      {/* Module Header */}
      <button
        onClick={onToggle}
        disabled={isLocked}
        className={cn(
          "w-full p-5 flex items-center gap-4 text-left",
          isLocked && "cursor-not-allowed opacity-60"
        )}
      >
        {/* Status Icon */}
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-xl transition-colors",
          isCompleted && "bg-complete/10",
          isInProgress && "bg-primary/10",
          isLocked && "bg-muted"
        )}>
          {isCompleted && <Check className="w-5 h-5 text-complete" />}
          {isInProgress && <Play className="w-5 h-5 text-primary" />}
          {isLocked && <Lock className="w-5 h-5 text-muted-foreground" />}
        </div>

        {/* Module Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Module {index + 1}
            </span>
            {isInProgress && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                In Progress
              </span>
            )}
          </div>
          <h3 className={cn(
            "font-medium",
            isLocked ? "text-muted-foreground" : "text-foreground"
          )}>
            {module.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">{module.description}</p>
        </div>

        {/* Progress & Expand */}
        <div className="flex items-center gap-4">
          {!isLocked && (
            <div className="text-right">
              <span className="text-sm font-medium text-foreground">{module.progress}%</span>
            </div>
          )}
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

      {/* Topics */}
      <AnimatePresence>
        {isExpanded && !isLocked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-2">
              {module.topics.map((topic, topicIndex) => (
                <TopicItem
                  key={topic.id}
                  topic={topic}
                  index={topicIndex}
                  isExpanded={expandedTopics.includes(topic.id)}
                  onToggle={() => onToggleTopic(topic.id)}
                  onStartLesson={onStartLesson}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface TopicItemProps {
  topic: Topic;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onStartLesson: (subtopicId: string) => void;
}

function TopicItem({ topic, index, isExpanded, onToggle, onStartLesson }: TopicItemProps) {
  const isLocked = topic.status === 'locked';
  const isCompleted = topic.status === 'completed';
  const isInProgress = topic.status === 'in-progress';

  return (
    <div className={cn(
      "rounded-xl border transition-all duration-200",
      isLocked ? "bg-muted/20 border-transparent" : "bg-background/50 border-border/50",
      isInProgress && "ring-1 ring-primary/30"
    )}>
      <button
        onClick={onToggle}
        disabled={isLocked}
        className={cn(
          "w-full p-4 flex items-center gap-3 text-left",
          isLocked && "cursor-not-allowed opacity-50"
        )}
      >
        {/* Status Indicator */}
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
          isCompleted && "bg-complete text-complete-foreground",
          isInProgress && "bg-primary text-primary-foreground",
          isLocked && "bg-muted text-muted-foreground"
        )}>
          {isCompleted ? <Check className="w-3.5 h-3.5" /> : isLocked ? <Lock className="w-3 h-3" /> : index + 1}
        </div>

        <span className={cn(
          "flex-1 font-medium text-sm",
          isLocked ? "text-muted-foreground" : "text-foreground"
        )}>
          {topic.title}
        </span>

        {!isLocked && (
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        )}
      </button>

      {/* Subtopics */}
      <AnimatePresence>
        {isExpanded && !isLocked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-1">
              {topic.subtopics.map((subtopic) => (
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
    </div>
  );
}

interface SubtopicItemProps {
  subtopic: Subtopic;
  onStart: () => void;
}

function SubtopicItem({ subtopic, onStart }: SubtopicItemProps) {
  const Icon = subtopicIcons[subtopic.type];
  const isLocked = subtopic.status === 'locked';
  const isCompleted = subtopic.status === 'completed';
  const isInProgress = subtopic.status === 'in-progress';
  const isAvailable = subtopic.status === 'available';

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
      {/* Type Icon */}
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center",
        subtopic.type === 'simulation' && "bg-primary/10",
        subtopic.type === 'practice' && "bg-practice/10",
        subtopic.type === 'recall' && "bg-success/10",
        subtopic.type === 'lesson' && "bg-muted"
      )}>
        <Icon className={cn(
          "w-4 h-4",
          subtopic.type === 'simulation' && "text-primary",
          subtopic.type === 'practice' && "text-practice",
          subtopic.type === 'recall' && "text-success",
          subtopic.type === 'lesson' && "text-muted-foreground"
        )} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <span className={cn(
          "text-sm",
          isCompleted && "text-muted-foreground line-through",
          isInProgress && "text-foreground font-medium",
          isAvailable && "text-foreground",
          isLocked && "text-muted-foreground"
        )}>
          {subtopic.title}
        </span>
        {subtopic.duration && (
          <span className="text-xs text-muted-foreground ml-2">
            {subtopic.duration}
          </span>
        )}
      </div>

      {/* Status */}
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
