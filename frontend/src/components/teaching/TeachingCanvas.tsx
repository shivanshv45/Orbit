import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ArrowRight, Sparkles } from 'lucide-react';

import { AskAIChat } from '@/components/teaching/AskAIChat';
import { lessonContent } from '@/data/mockCurriculum';
import { cn } from '@/lib/utils';

interface TeachingCanvasProps {
  subtopicId: string;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function TeachingCanvas({ subtopicId, onNext }: TeachingCanvasProps) {
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [askAIOpen, setAskAIOpen] = useState<number | null>(null);
  const content = lessonContent[subtopicId as keyof typeof lessonContent];

  // Reset chunk index when subtopic changes
  useState(() => {
    setCurrentChunkIndex(0);
    setAskAIOpen(null);
  });

  if (!content) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        Content not available
      </div>
    );
  }

  const visibleSections = content.sections.slice(0, currentChunkIndex + 1);
  const hasMoreChunks = currentChunkIndex < content.sections.length - 1;

  const handleContinue = () => {
    if (hasMoreChunks) {
      setCurrentChunkIndex(prev => prev + 1);
      setAskAIOpen(null);
    } else {
      // All chunks done, proceed to next subtopic
      setCurrentChunkIndex(0);
      onNext();
    }
  };

  const getTextContent = (
      section: typeof content.sections[0]
  ): string => {
    switch (section.type) {
      case 'text':
      case 'insight':
        return section.content ?? '';

      case 'equation':
        return `${section.content} - ${section.label ?? 'Equation'}`;

      case 'list':
        return section.items?.join(', ') ?? '';

      default:
        return 'This section';
    }
  };

  // @ts-ignore
  // @ts-ignore
  return (
    <div className="space-y-6">
      {/* Lesson Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-2xl font-semibold text-foreground">{content.title}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{currentChunkIndex + 1} of {content.sections.length} sections</span>
          <div className="flex-1 max-w-32 h-1 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentChunkIndex + 1) / content.sections.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Content Sections - Shown chunk by chunk */}
      <div className="space-y-4">
        <AnimatePresence mode="sync">
          {visibleSections.map((section, index) => (
            <motion.div
              key={`${subtopicId}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index === currentChunkIndex ? 0.1 : 0 }}
              className="relative"
            >
              <div className={cn(
                "transition-opacity duration-300",
                index < currentChunkIndex ? "opacity-60" : "opacity-100"
              )}>
                {section.type === 'text' && (
                  <p className="text-foreground leading-relaxed text-lg">
                    {section.content}
                  </p>
                )}

                {section.type === 'equation' && (
                  <div className="my-6 p-8 rounded-2xl bg-accent/50 border border-primary/20 text-center">
                    <div className="text-4xl font-serif text-foreground mb-2">
                      {section.content}
                    </div>
                    {section.label && (
                      <p className="text-sm text-muted-foreground">{section.label}</p>
                    )}
                  </div>
                )}

                {section.type === 'insight' && (
                  <div className="flex gap-4 p-5 rounded-2xl bg-success/10 border border-success/20">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                      <Lightbulb className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-1">Key Insight</p>
                      <p className="text-muted-foreground">{section.content}</p>
                    </div>
                  </div>
                )}

                {section.type === 'list' && (
                  <ul className="space-y-2 pl-1">
                    {section.items?.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {section.type === 'diagram' && (
                  <div className="my-6 p-8 rounded-2xl bg-muted/50 border border-border text-center">
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-8">
                        <div className="text-center">
                          <div className="w-16 h-16 rounded-xl bg-primary/20 border-2 border-primary flex items-center justify-center mb-2">
                            <span className="text-xl">🛒</span>
                          </div>
                          <p className="text-sm text-muted-foreground">Small mass</p>
                          <p className="text-xs text-primary">High acceleration</p>
                        </div>
                        
                        <ArrowRight className="w-8 h-8 text-muted-foreground" />
                        
                        <div className="text-center">
                          <div className="w-20 h-16 rounded-xl bg-muted border-2 border-border flex items-center justify-center mb-2">
                            <span className="text-xl">🚗</span>
                          </div>
                          <p className="text-sm text-muted-foreground">Large mass</p>
                          <p className="text-xs text-muted-foreground">Low acceleration</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground italic">
                        Same force applied, different accelerations
                      </p>
                    </div>
                  </div>
                )}

                {section.type === 'simulation' && (
                  <div className="my-6">
                    {section.id === 'newton-second-law' }
                    {section.id === 'newton-third-law' }
                    {section.id === 'friction-sim' }
                    {section.id === 'critical-speed' }
                    {!section.id }
                  </div>
                )}
              </div>

              {/* Ask AI Button - Shows on current chunk */}
              {index === currentChunkIndex && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-3"
                >
                  <button
                    onClick={() => setAskAIOpen(askAIOpen === index ? null : index)}
                    className={cn(
                      "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all",
                      askAIOpen === index
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Ask AI about this
                  </button>

                  <AskAIChat
                    quotedText={getTextContent(section)}
                    isOpen={askAIOpen === index}
                    onClose={() => setAskAIOpen(null)}
                  />
                </motion.div>
              )}

              {/* Divider between chunks */}
              {index < currentChunkIndex && (
                <div className="mt-4 border-b border-border/50" />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Continue Button */}
      <motion.div
        key={`continue-${currentChunkIndex}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="pt-4"
      >
        <button
          onClick={handleContinue}
          className={cn(
            "w-full h-14 rounded-2xl font-medium text-lg transition-all duration-300",
            "bg-primary text-primary-foreground",
            "hover:scale-[1.01] hover:shadow-glow"
          )}
        >
          {hasMoreChunks ? 'Continue' : 'Next Lesson'}
        </button>
      </motion.div>
    </div>
  );
}
