import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ArrowRight, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PracticeQuestionProps {
  question: {
    id: string;
    type: 'conceptual' | 'numerical' | 'misconception';
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  };
  onComplete: (correct: boolean) => void;
  questionNumber: number;
  totalQuestions: number;
}

export function PracticeQuestion({ 
  question, 
  onComplete, 
  questionNumber, 
  totalQuestions 
}: PracticeQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const isCorrect = selectedAnswer === question.correctAnswer;

  const handleSelect = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    setShowResult(true);
  };

  const handleContinue = () => {
    onComplete(isCorrect);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const typeLabels = {
    conceptual: 'Conceptual',
    numerical: 'Problem Solving',
    misconception: 'Myth Check',
  };

  const typeColors = {
    conceptual: 'bg-primary/10 text-primary',
    numerical: 'bg-practice/10 text-practice',
    misconception: 'bg-success/10 text-success',
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", typeColors[question.type])}>
            {typeLabels[question.type]}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
            className="h-full rounded-full bg-progress-gradient"
          />
        </div>
      </div>

      {/* Question */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-xl font-medium text-foreground leading-relaxed">
          {question.question}
        </h2>
      </motion.div>

      {/* Options */}
      <div className="space-y-3 mb-8">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrectAnswer = index === question.correctAnswer;
          
          let optionState = 'default';
          if (showResult) {
            if (isCorrectAnswer) optionState = 'correct';
            else if (isSelected && !isCorrectAnswer) optionState = 'incorrect';
          } else if (isSelected) {
            optionState = 'selected';
          }

          return (
            <motion.button
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleSelect(index)}
              disabled={showResult}
              className={cn(
                "w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-4",
                optionState === 'default' && "border-border bg-card hover:border-primary/50 hover:bg-accent/30",
                optionState === 'selected' && "border-primary bg-accent/50",
                optionState === 'correct' && "border-complete bg-complete/10",
                optionState === 'incorrect' && "border-destructive bg-destructive/10",
                showResult && "cursor-default"
              )}
            >
              {/* Letter indicator */}
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors",
                optionState === 'default' && "bg-muted text-muted-foreground",
                optionState === 'selected' && "bg-primary text-primary-foreground",
                optionState === 'correct' && "bg-complete text-complete-foreground",
                optionState === 'incorrect' && "bg-destructive text-destructive-foreground"
              )}>
                {showResult && isCorrectAnswer ? (
                  <Check className="w-4 h-4" />
                ) : showResult && isSelected && !isCorrectAnswer ? (
                  <X className="w-4 h-4" />
                ) : (
                  String.fromCharCode(65 + index)
                )}
              </div>

              <span className={cn(
                "flex-1 text-foreground",
                optionState === 'incorrect' && "text-muted-foreground"
              )}>
                {option}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Result & Explanation */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 overflow-hidden"
          >
            <div className={cn(
              "p-5 rounded-2xl",
              isCorrect ? "bg-complete/10 border border-complete/20" : "bg-accent border border-border"
            )}>
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  isCorrect ? "bg-complete/20" : "bg-primary/20"
                )}>
                  {isCorrect ? (
                    <Check className="w-5 h-5 text-complete" />
                  ) : (
                    <Lightbulb className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className={cn(
                    "font-medium mb-1",
                    isCorrect ? "text-complete" : "text-foreground"
                  )}>
                    {isCorrect ? "Correct!" : "Not quite right"}
                  </p>
                  <p className="text-muted-foreground">
                    {question.explanation}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {!showResult ? (
          <button
            onClick={handleSubmit}
            disabled={selectedAnswer === null}
            className={cn(
              "w-full h-14 rounded-2xl font-medium text-lg transition-all duration-300",
              selectedAnswer !== null
                ? "bg-primary text-primary-foreground hover:scale-[1.01] hover:shadow-glow"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            Check Answer
          </button>
        ) : (
          <button
            onClick={handleContinue}
            className={cn(
              "w-full h-14 rounded-2xl font-medium text-lg transition-all duration-300 flex items-center justify-center gap-2",
              "bg-primary text-primary-foreground hover:scale-[1.01] hover:shadow-glow"
            )}
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </motion.div>
    </div>
  );
}
