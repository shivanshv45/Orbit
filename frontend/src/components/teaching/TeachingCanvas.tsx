import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AskAIChat } from '@/components/teaching/AskAIChat';
import { QuestionBlock } from '@/components/teaching/QuestionBlock';
import { SimulationBlock } from '@/components/teaching/SimulationBlock';
import type { TeachingBlock, QuestionBlock as QuestionType } from '@/types/teaching';
import { api } from '@/lib/api';
import { createOrGetUser } from '@/logic/userSession';

interface TeachingCanvasProps {
  blocks: TeachingBlock[];
  subtopicId: string;
  onNext: () => void;
  hasNext: boolean;
}

export function TeachingCanvas({ blocks, subtopicId, onNext, hasNext }: TeachingCanvasProps) {
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [askAIOpen, setAskAIOpen] = useState<number | null>(null);
  const [questionAnswered, setQuestionAnswered] = useState<Record<number, boolean>>({});
  const [questionScores, setQuestionScores] = useState<Record<number, number>>({});
  const { uid } = createOrGetUser();

  useEffect(() => {
    setCurrentChunkIndex(0);
    setAskAIOpen(null);
    setQuestionAnswered({});
    setQuestionScores({});
  }, [subtopicId]);

  if (!blocks || blocks.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        Content not available
      </div>
    );
  }

  const visibleBlocks = blocks.slice(0, currentChunkIndex + 1);
  const hasMoreChunks = currentChunkIndex < blocks.length - 1;
  const currentBlock = blocks[currentChunkIndex];

  const questions = blocks.filter(b => b.type === 'question') as QuestionType[];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(questionAnswered).length;

  const handleContinue = async () => {
    if (currentBlock?.type === 'question' && !questionAnswered[currentChunkIndex]) {
      return;
    }

    if (hasMoreChunks) {
      setCurrentChunkIndex(prev => prev + 1);
      setAskAIOpen(null);
    } else {
      if (totalQuestions > 0 && answeredCount === totalQuestions) {
        const scores = Object.values(questionScores);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const finalScore = Math.round(avgScore * 100);

        try {
          await api.updateSubtopicScore({
            user_id: uid,
            subtopic_id: subtopicId,
            final_score: finalScore,
          });
        } catch (error) {
          console.error('Failed to update score:', error);
        }
      }

      setCurrentChunkIndex(0);
      onNext();
    }
  };

  const handleQuestionCorrect = (index: number, attemptCount: number) => {
    setQuestionAnswered(prev => ({ ...prev, [index]: true }));

    let score = 0.25;
    if (attemptCount === 1) score = 1.0;
    else if (attemptCount === 2) score = 0.75;
    else if (attemptCount === 3) score = 0.5;

    setQuestionScores(prev => ({ ...prev, [index]: score }));
  };

  const getTextContent = (block: TeachingBlock): string => {
    switch (block.type) {
      case 'paragraph':
        return block.content;
      case 'insight':
        return block.content;
      case 'formula':
        return `${block.formula} - ${block.explanation}`;
      case 'list':
        return block.items.join(', ');
      case 'question':
        return block.question;

      default:
        return 'This section';
    }
  };

  const renderBlock = (block: TeachingBlock) => {
    switch (block.type) {
      case 'paragraph':
        return (
          <p className="text-foreground leading-relaxed text-lg">
            {block.content}
          </p>
        );

      case 'formula':
        return (
          <div className="my-6 p-8 rounded-2xl bg-accent/50 border border-primary/20 text-center">
            <div className="text-4xl font-serif text-foreground mb-2">
              {block.formula}
            </div>
            {block.explanation && (
              <p className="text-sm text-muted-foreground">{block.explanation}</p>
            )}
          </div>
        );

      case 'insight':
        return (
          <div className="flex gap-4 p-5 rounded-2xl bg-success/10 border border-success/20">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Key Insight</p>
              <p className="text-muted-foreground">{block.content}</p>
            </div>
          </div>
        );

      case 'list':
        return (
          <ul className="space-y-2 pl-1">
            {block.items?.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        );

      case 'simulation':
        return (
          <SimulationBlock html={block.html} description={block.description} />
        );



      case 'question':
        return null;

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{currentChunkIndex + 1} of {blocks.length} sections</span>
          <div className="flex-1 max-w-32 h-1 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentChunkIndex + 1) / blocks.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </motion.div>

      <div className="space-y-4">
        <AnimatePresence mode="sync">
          {visibleBlocks.map((block, index) => (
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
                {block.type === 'question' ? (
                  <QuestionBlock
                    question={block}
                    subtopicId={subtopicId}
                    onCorrect={(attemptCount) => handleQuestionCorrect(index, attemptCount)}
                  />
                ) : (
                  renderBlock(block)
                )}
              </div>

              {index === currentChunkIndex && block.type !== 'question' && (
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
                    quotedText={getTextContent(block)}
                    isOpen={askAIOpen === index}
                    onClose={() => setAskAIOpen(null)}
                  />
                </motion.div>
              )}

              {index < currentChunkIndex && (
                <div className="mt-4 border-b border-border/50" />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <motion.div
        key={`continue-${currentChunkIndex}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="pt-4"
      >
        <button
          onClick={handleContinue}
          disabled={currentBlock?.type === 'question' && !questionAnswered[currentChunkIndex]}
          className={cn(
            "w-full h-14 rounded-2xl font-medium text-lg transition-all duration-300",
            currentBlock?.type === 'question' && !questionAnswered[currentChunkIndex]
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:scale-[1.01] hover:shadow-glow"
          )}
        >
          {hasMoreChunks ? 'Continue' : (hasNext ? 'Next Lesson' : 'Complete')}
        </button>
      </motion.div>
    </div>
  );
}
