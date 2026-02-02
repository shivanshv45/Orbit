import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Lightbulb, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuestionBlock as QuestionType } from '@/types/teaching';


const renderMarkdownContent = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            const text = part.slice(2, -2);
            return (
                <strong key={index} className="font-semibold text-primary">
                    {text}
                </strong>
            );
        }
        return <span key={index}>{part}</span>;
    });
};

interface QuestionBlockProps {
    question: QuestionType;
    subtopicId: string;
    onCorrect: (attemptCount: number) => void;
}

export function QuestionBlock({ question, subtopicId, onCorrect }: QuestionBlockProps) {
    const [selectedAnswer, setSelectedAnswer] = useState<number | string | null>(null);
    const [fillInAnswer, setFillInAnswer] = useState('');
    const [attemptCount, setAttemptCount] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [hasAnsweredCorrectly, setHasAnsweredCorrectly] = useState(false);

    const handleSelectOption = (index: number) => {
        if (showResult || hasAnsweredCorrectly) return;
        setSelectedAnswer(index);
    };

    const handleSubmit = () => {
        if (hasAnsweredCorrectly) return;

        if (question.questionType === 'mcq' && selectedAnswer === null) return;
        if (question.questionType === 'fill_in_blank' && !fillInAnswer.trim()) return;

        let correct = false;

        if (question.questionType === 'mcq') {
            correct = selectedAnswer === question.correctIndex;
        } else {
            const userAnswer = fillInAnswer.trim().toLowerCase();
            const correctMain = question.correctAnswer?.toLowerCase();
            const accepted = question.acceptedAnswers?.map(a => a.toLowerCase()) || [];

            correct = userAnswer === correctMain || accepted.includes(userAnswer);
        }

        const newAttemptCount = attemptCount + 1;
        setAttemptCount(newAttemptCount);
        setIsCorrect(correct);
        setShowResult(true);

        if (correct) {
            setHasAnsweredCorrectly(true);
            setTimeout(() => {
                onCorrect(newAttemptCount);
            }, 300);
        }
    };

    const handleTryAgain = () => {
        setShowResult(false);
        if (question.questionType === 'fill_in_blank') {
            setFillInAnswer('');
        } else {
            setSelectedAnswer(null);
        }
    };

    const getAttemptMessage = () => {
        if (attemptCount === 1) return "First try!";
        if (attemptCount === 2) return "Second attempt";
        return `Attempt ${attemptCount}`;
    };

    const shouldShowExplanation = isCorrect || attemptCount >= 4;

    return (
        <div className="my-6 p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20">
            <div className="flex items-start gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                            Question
                        </span>
                        {attemptCount > 0 && !hasAnsweredCorrectly && (
                            <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                                {getAttemptMessage()}
                            </span>
                        )}
                    </div>
                    <p className="text-lg font-medium text-foreground leading-relaxed">
                        {renderMarkdownContent(question.question)}
                    </p>
                </div>
            </div>

            {question.questionType === 'mcq' && question.options && (
                <div className="space-y-2 mb-5">
                    {question.options.map((option, index) => {
                        const isSelected = selectedAnswer === index;
                        const isCorrectAnswer = index === question.correctIndex;

                        let optionState = 'default';
                        if (showResult || hasAnsweredCorrectly) {
                            if (isCorrectAnswer && shouldShowExplanation) optionState = 'correct';
                            else if (isSelected && !isCorrectAnswer) optionState = 'incorrect';
                        } else if (isSelected) {
                            optionState = 'selected';
                        }

                        return (
                            <motion.button
                                key={index}
                                data-option={String.fromCharCode(65 + index)}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleSelectOption(index)}
                                disabled={showResult || hasAnsweredCorrectly}
                                className={cn(
                                    "w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-3",
                                    optionState === 'default' && "border-border bg-background hover:border-primary/50 hover:bg-accent/30 cursor-pointer",
                                    optionState === 'selected' && "border-primary bg-primary/10",
                                    optionState === 'correct' && "border-complete bg-complete/10",
                                    optionState === 'incorrect' && "border-destructive bg-destructive/10",
                                    (showResult || hasAnsweredCorrectly) && "cursor-default"
                                )}
                            >
                                <div className={cn(
                                    "w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold transition-colors flex-shrink-0",
                                    optionState === 'default' && "bg-muted text-muted-foreground",
                                    optionState === 'selected' && "bg-primary text-primary-foreground",
                                    optionState === 'correct' && "bg-complete text-complete-foreground",
                                    optionState === 'incorrect' && "bg-destructive text-destructive-foreground"
                                )}>
                                    {showResult && isCorrectAnswer && shouldShowExplanation ? (
                                        <Check className="w-5 h-5" />
                                    ) : showResult && isSelected && !isCorrectAnswer ? (
                                        <X className="w-5 h-5" />
                                    ) : (
                                        String.fromCharCode(65 + index)
                                    )}
                                </div>

                                <span className={cn(
                                    "flex-1 text-foreground font-medium",
                                    optionState === 'incorrect' && "text-muted-foreground"
                                )}>
                                    {renderMarkdownContent(option)}
                                </span>
                            </motion.button>
                        );
                    })}
                </div>
            )}

            {question.questionType === 'fill_in_blank' && (
                <div className="mb-5">
                    <input
                        type="text"
                        value={fillInAnswer}
                        onChange={(e) => setFillInAnswer(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        disabled={hasAnsweredCorrectly}
                        placeholder="Type your answer here..."
                        className={cn(
                            "w-full p-4 rounded-xl border-2 bg-background text-foreground font-medium transition-all",
                            showResult && isCorrect && "border-complete bg-complete/5",
                            showResult && !isCorrect && "border-destructive bg-destructive/5",
                            !showResult && "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                        )}
                    />
                </div>
            )}


            <AnimatePresence>
                {showResult && !isCorrect && attemptCount < 4 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-5 rounded-xl border-2 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-100 dark:bg-amber-900/30">
                                    <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold mb-2 text-base text-amber-900 dark:text-amber-100">
                                        Hint
                                    </p>
                                    <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                                        {question.hint}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {showResult && shouldShowExplanation && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="overflow-hidden"
                    >
                        <div className={cn(
                            "p-5 rounded-xl border-2",
                            isCorrect
                                ? "bg-green-500/10 border-green-500/30"
                                : "bg-accent border-border"
                        )}>
                            <div className="flex items-start gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                                    isCorrect ? "bg-green-500/20" : "bg-primary/20"
                                )}>
                                    {isCorrect ? (
                                        <Check className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <Lightbulb className="w-5 h-5 text-primary" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    {isCorrect ? (
                                        <>
                                            <p className="font-semibold mb-2 text-base text-green-500">
                                                Correct! Well done! 🎉
                                            </p>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {question.explanations.correct}
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="font-semibold mb-2 text-base text-foreground">
                                                Not quite right
                                            </p>
                                            {question.questionType === 'fill_in_blank' && (
                                                <p className="text-sm font-medium text-foreground">
                                                    The correct answer is: <span className="text-primary font-semibold">{question.correctAnswer}</span>
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>


            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                {!hasAnsweredCorrectly && (
                    showResult && !isCorrect ? (
                        <button
                            onClick={handleTryAgain}
                            className="w-full h-14 rounded-xl font-medium text-base transition-all duration-300 bg-primary text-primary-foreground hover:scale-[1.01] hover:shadow-lg"
                        >
                            Try Again
                        </button>
                    ) : (
                        <button
                            data-submit-btn="true"
                            onClick={handleSubmit}
                            disabled={
                                (question.questionType === 'mcq' && selectedAnswer === null) ||
                                (question.questionType === 'fill_in_blank' && !fillInAnswer.trim())
                            }
                            className={cn(
                                "w-full h-14 rounded-xl font-medium text-base transition-all duration-300",
                                (selectedAnswer !== null || fillInAnswer.trim())
                                    ? "bg-primary text-primary-foreground hover:scale-[1.01] hover:shadow-lg"
                                    : "bg-muted text-muted-foreground cursor-not-allowed"
                            )}
                        >
                            Submit Answer
                        </button>
                    )
                )}
            </motion.div>
        </div>
    );
}
