import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Target, Brain, Clock, PanelRightClose, PanelRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  streak: number;
  lessonsCompleted: number;
  totalLessons: number;
  practiceScore: number;
  estimatedTimeLeft: string;
  isOpen: boolean;
  onToggle: () => void;
}

export function ProgressIndicator({
  streak,
  lessonsCompleted,
  totalLessons,
  practiceScore,
  estimatedTimeLeft,
  isOpen,
  onToggle,
}: ProgressIndicatorProps) {
  const completionPercent = Math.round((lessonsCompleted / totalLessons) * 100);

  return (
    <>
      {/* Toggle Button - Always visible at top right */}
      <button
        onClick={onToggle}
        className={cn(
          "fixed top-4 right-4 z-50 p-2 rounded-lg transition-all duration-200",
          "bg-card border border-border hover:bg-muted",
          "text-muted-foreground hover:text-foreground"
        )}
        aria-label={isOpen ? "Close progress panel" : "Open progress panel"}
      >
        {isOpen ? (
          <PanelRightClose className="w-5 h-5" />
        ) : (
          <PanelRight className="w-5 h-5" />
        )}
      </button>

      {/* Sliding Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 256, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 256, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-64 h-full border-l border-border bg-card/95 backdrop-blur-sm flex flex-col fixed right-0 top-0 z-40"
          >
            {/* Header */}
            <div className="p-4 border-b border-border mt-12">
              <h3 className="text-sm font-medium text-foreground">Your Progress</h3>
            </div>

            {/* Stats */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {/* Completion Ring */}
              <div className="flex flex-col items-center py-4">
                <div className="relative w-28 h-28">
                  {/* Background circle */}
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="8"
                    />
                    <motion.circle
                      cx="56"
                      cy="56"
                      r="48"
                      fill="none"
                      stroke="url(#progressGradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: "0 302" }}
                      animate={{ strokeDasharray: `${completionPercent * 3.02} 302` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="hsl(var(--complete))" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* Center content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-semibold text-foreground tabular-nums">
                      {completionPercent}%
                    </span>
                    <span className="text-xs text-muted-foreground">Complete</span>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mt-3">
                  {lessonsCompleted} of {totalLessons} lessons
                </p>
              </div>

              {/* Quick Stats */}
              <div className="space-y-3">
                {/* Streak */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{streak} day streak</p>
                    <p className="text-xs text-muted-foreground">Keep it up!</p>
                  </div>
                </div>

                {/* Practice Score */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{practiceScore}% accuracy</p>
                    <p className="text-xs text-muted-foreground">Practice questions</p>
                  </div>
                </div>

                {/* Time Left */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <div className="w-10 h-10 rounded-lg bg-practice/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-practice" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{estimatedTimeLeft}</p>
                    <p className="text-xs text-muted-foreground">Estimated remaining</p>
                  </div>
                </div>
              </div>

              {/* Next Milestone */}
              <div className="mt-4 p-4 rounded-xl border border-primary/20 bg-accent/30">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Next Milestone</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Complete Newton's Second Law to unlock Applications
                </p>
                <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '60%' }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
              </div>
            </div>

            {/* Ready State */}
            <div className="p-4 border-t border-border">
              <div className={cn(
                "p-3 rounded-xl text-center transition-all",
                completionPercent >= 30 ? "bg-complete/10" : "bg-muted/50"
              )}>
                {completionPercent >= 30 ? (
                  <p className="text-sm text-complete font-medium">
                    Great progress! You're on track.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Keep going to build momentum
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
