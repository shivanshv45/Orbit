import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Sparkles, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AskAIChat } from '@/components/teaching/AskAIChat';
import { QuestionBlock } from '@/components/teaching/QuestionBlock';
import { SimulationBlock } from '@/components/teaching/SimulationBlock';
import type { TeachingBlock, QuestionBlock as QuestionType } from '@/types/teaching';
import { api } from '@/lib/api';
import { createOrGetUser } from '@/logic/userSession';
import { useAccessibilityMode } from '@/context/AccessibilityModeContext';
import { VoiceContentConverter } from '@/lib/voice/VoiceContentConverter';
import { VoiceSettings } from './VoiceSettings';
import { formatFormula } from '@/lib/formatFormula';

interface TeachingCanvasProps {
  blocks: TeachingBlock[];
  subtopicId: string;
  onNext: () => void;
  onPrevious?: () => void;
  hasNext: boolean;
  hasPrevious?: boolean;
  onNextLesson?: () => void;
  onPreviousLesson?: () => void;
}

export function TeachingCanvas({
  blocks,
  subtopicId,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious = false,
  onNextLesson,
  onPreviousLesson,
}: TeachingCanvasProps) {
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [askAIOpen, setAskAIOpen] = useState<number | null>(null);
  const [hoveredBlock, setHoveredBlock] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [questionAnswered, setQuestionAnswered] = useState<Record<number, boolean>>({});
  const [questionScores, setQuestionScores] = useState<Record<number, number>>({});
  const { uid } = createOrGetUser();

  const {
    isAccessibilityModeOn,
    speak,
    speakMultiple,
    prefetch,
    setTeachingCommandHandler,
    updateSpeed,
    updatePitch,
    getPreferences,
  } = useAccessibilityMode();

  const contentConverterRef = useRef(new VoiceContentConverter('normal'));
  const lastSpokenSubtopicRef = useRef<string>('');
  const lastSpokenBlockRef = useRef<number>(-1);

  useEffect(() => {
    setCurrentChunkIndex(0);
    setAskAIOpen(null);
    setQuestionAnswered({});
    setQuestionScores({});
    lastSpokenBlockRef.current = -1;
  }, [subtopicId]);

  const visibleBlocks = blocks.slice(0, currentChunkIndex + 1);
  const hasMoreChunks = currentChunkIndex < blocks.length - 1;
  const currentBlock = blocks[currentChunkIndex];

  const questions = blocks.filter(b => b.type === 'question') as QuestionType[];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(questionAnswered).length;

  const handleContinue = useCallback(async () => {
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
      lastSpokenBlockRef.current = -1;
      onNext();
    }
  }, [currentBlock, currentChunkIndex, hasMoreChunks, questionAnswered, totalQuestions, answeredCount, questionScores, uid, subtopicId, onNext]);

  const handleQuestionCorrect = (index: number, attemptCount: number) => {
    setQuestionAnswered(prev => ({ ...prev, [index]: true }));

    let score = 0.25;
    if (attemptCount === 1) score = 1.0;
    else if (attemptCount === 2) score = 0.75;
    else if (attemptCount === 3) score = 0.5;

    setQuestionScores(prev => ({ ...prev, [index]: score }));

    if (isAccessibilityModeOn) {
      const feedback = attemptCount === 1
        ? 'Correct! Great job! Say next to continue.'
        : 'Correct! Say next to continue.';
      speak(feedback, true);
    }
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
        return '';
    }
  };

  const speakCurrentBlock = useCallback(() => {
    if (!isAccessibilityModeOn || !blocks[currentChunkIndex]) return;

    const scripts = contentConverterRef.current.convertBlock(
      blocks[currentChunkIndex],
      currentChunkIndex,
      blocks.length
    );
    const texts = scripts.map(s => s.text);
    speakMultiple(texts);

    const prefetchTexts = contentConverterRef.current.getTextsForPrefetch(
      blocks,
      currentChunkIndex + 1,
      3
    );
    if (prefetchTexts.length > 0) {
      prefetch(prefetchTexts);
    }
  }, [isAccessibilityModeOn, blocks, currentChunkIndex, speakMultiple, prefetch]);

  useEffect(() => {
    if (!isAccessibilityModeOn) return;
    if (lastSpokenSubtopicRef.current !== subtopicId) {
      lastSpokenSubtopicRef.current = subtopicId;
      lastSpokenBlockRef.current = -1;
    }
    if (lastSpokenBlockRef.current === currentChunkIndex) return;

    lastSpokenBlockRef.current = currentChunkIndex;

    const timer = setTimeout(() => {
      speakCurrentBlock();
    }, 400);

    return () => clearTimeout(timer);
  }, [isAccessibilityModeOn, subtopicId, currentChunkIndex, speakCurrentBlock]);

  const handleVoiceCommand = useCallback((transcript: string): boolean => {
    const normalized = transcript.toLowerCase().trim();

    if (normalized.includes('next') || normalized.includes('continue') || normalized.includes('forward')) {
      handleContinue();
      return true;
    }

    if (normalized.includes('repeat') || normalized.includes('again') || normalized.includes('what')) {
      lastSpokenBlockRef.current = -1;
      speakCurrentBlock();
      return true;
    }

    if (normalized.includes('previous') && !normalized.includes('lesson')) {
      if (currentChunkIndex > 0) {
        setCurrentChunkIndex(prev => prev - 1);
        lastSpokenBlockRef.current = -1;
      } else if (onPrevious) {
        onPrevious();
      }
      return true;
    }

    if (normalized.includes('next lesson')) {
      if (onNextLesson) {
        speak('Going to next lesson');
        setTimeout(() => onNextLesson(), 1500);
      } else {
        speak('No next lesson available');
      }
      return true;
    }

    if (normalized.includes('previous lesson') || normalized.includes('last lesson')) {
      if (onPreviousLesson) {
        speak('Going to previous lesson');
        setTimeout(() => onPreviousLesson(), 1500);
      } else {
        speak('No previous lesson available');
      }
      return true;
    }

    if (normalized.includes('faster') || normalized.includes('speed up')) {
      const prefs = getPreferences();
      updateSpeed(Math.min(2, prefs.rate + 0.2));
      speak('Speed increased');
      return true;
    }

    if (normalized.includes('slower') || normalized.includes('slow down')) {
      const prefs = getPreferences();
      updateSpeed(Math.max(0.5, prefs.rate - 0.2));
      speak('Speed decreased');
      return true;
    }

    if (normalized.includes('progress') || normalized.includes('where am i')) {
      speak(`Section ${currentChunkIndex + 1} of ${blocks.length}`);
      return true;
    }

    const optionMatch = normalized.match(/\b(option\s*)?([abcd])\b/);
    if (optionMatch && currentBlock?.type === 'question') {
      const option = optionMatch[2].toUpperCase();
      speak(`Selecting option ${option}`);
      setTimeout(() => {
        const btn = document.querySelector(`button[data-option="${option}"]`);
        if (btn) (btn as HTMLButtonElement).click();
      }, 500);
      return true;
    }

    if ((normalized.includes('submit') || normalized === 'check') && currentBlock?.type === 'question') {
      speak('Submitting answer');
      setTimeout(() => {
        const btn = document.querySelector('button[data-submit-btn="true"]');
        if (btn) (btn as HTMLButtonElement).click();
      }, 500);
      return true;
    }

    return false;
  }, [currentChunkIndex, currentBlock, blocks.length, handleContinue, speakCurrentBlock, onPrevious, onNextLesson, onPreviousLesson, speak, updateSpeed, getPreferences]);

  useEffect(() => {
    if (isAccessibilityModeOn) {
      setTeachingCommandHandler(handleVoiceCommand);
      return () => setTeachingCommandHandler(null);
    }
  }, [isAccessibilityModeOn, handleVoiceCommand, setTeachingCommandHandler]);

  const renderMarkdownContent = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const text = part.slice(2, -2);
        return <strong key={index} className="font-semibold text-primary">{text}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const renderBlock = (block: TeachingBlock) => {
    switch (block.type) {
      case 'paragraph':
        return (
          <p className="text-foreground leading-relaxed text-lg">
            {renderMarkdownContent(block.content)}
          </p>
        );

      case 'formula':
        const formulaLength = block.formula?.length || 0;
        const isLongFormula = formulaLength > 50;
        const isVeryLongFormula = formulaLength > 100;

        return (
          <div className={cn(
            "relative p-8 rounded-2xl bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-purple-500/20",
            "backdrop-blur-sm"
          )}>
            <div className="flex flex-col items-center justify-center gap-4">
              <div className={cn(
                "font-mono text-foreground tracking-wide text-center px-6 py-4",
                "bg-background/50 rounded-xl border border-border/50",
                "shadow-lg",
                isVeryLongFormula ? "text-lg md:text-xl" : isLongFormula ? "text-xl md:text-2xl" : "text-2xl md:text-3xl"
              )}>
                <code className="whitespace-pre-wrap break-words">
                  {formatFormula(block.formula)}
                </code>
              </div>
              {block.explanation && (
                <p className="text-sm text-muted-foreground text-center max-w-2xl leading-relaxed">
                  {block.explanation}
                </p>
              )}
            </div>
          </div>
        );

      case 'insight':
        return (
          <div className="flex gap-4 p-5 rounded-2xl bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="font-semibold text-yellow-500 mb-1">Key Insight</p>
              <p className="text-foreground">{renderMarkdownContent(block.content)}</p>
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
                <span className="text-foreground">{renderMarkdownContent(item)}</span>
              </li>
            ))}
          </ul>
        );

      case 'simulation':
        return <SimulationBlock html={block.html} description={block.description} />;

      case 'question':
        return null;

      default:
        return null;
    }
  };

  if (!blocks || blocks.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        Content not available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 flex-1">
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

          {isAccessibilityModeOn && (
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Voice settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
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
              onMouseEnter={() => setHoveredBlock(index)}
              onMouseLeave={() => setHoveredBlock(null)}
            >
              <div className={cn(
                "transition-opacity duration-300",
                index < currentChunkIndex ? "opacity-60 hover:opacity-100" : "opacity-100"
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

              {(index === currentChunkIndex || hoveredBlock === index) && block.type !== 'question' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3"
                >
                  <button
                    onClick={() => setAskAIOpen(askAIOpen === index ? null : index)}
                    data-ask-ai="true"
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
        <div className="flex gap-3 items-center">
          <button
            onClick={handleContinue}
            disabled={currentBlock?.type === 'question' && !questionAnswered[currentChunkIndex]}
            className={cn(
              "flex-1 h-14 rounded-2xl font-medium text-lg transition-all duration-300",
              currentBlock?.type === 'question' && !questionAnswered[currentChunkIndex]
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:scale-[1.01] hover:shadow-glow"
            )}
          >
            {hasMoreChunks ? 'Continue' : (hasNext ? 'Next Lesson' : 'Complete')}
          </button>
        </div>
      </motion.div>

      <VoiceSettings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onPreferencesChange={(prefs) => {
          if (prefs.rate) updateSpeed(prefs.rate);
          if (prefs.pitch) updatePitch(prefs.pitch);
        }}
        onTestVoice={(text) => speak(text, true)}
      />
    </div>
  );
}
