import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Lightbulb, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { createOrGetUser } from '@/logic/userSession';
import type { QuestionBlock as QuestionType } from '@/types/teaching';

interface QuestionBlockProps {
    question: QuestionType;
    subtopicId: string;
    onCorrect: () => void;
}

export function QuestionBlock({ question, subtopicId, onCorrect }: QuestionBlockProps) {
    const [selectedAnswer, setSelectedAnswer] = useState<number | string | null>(null);
    const [fillInAnswer, setFillInAnswer] = useState('');
    const [attemptCount, setAttemptCount] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasAnsweredCorrectly, setHasAnsweredCorrectly] = useState(false);
    const { uid } = createOrGetUser();

    const handleSelectOption = (index: number) => {
        if (showResult || hasAnsweredCorrectly) return;
        setSelectedAnswer(index);
    };

    const handleSubmit = async () => {
        if (hasAnsweredCorrectly) return;

        // Validate answer is selected
        if (question.questionType === 'mcq' && selectedAnswer === null) return;
        if (question.questionType === 'fill_in_blank' && !fillInAnswer.trim()) return;

        setIsSubmitting(true);

        try {
            // Check if answer is correct
            let correct = false;
            let userAnswer: string | number;

            if (question.questionType === 'mcq') {
                userAnswer = selectedAnswer as number;
                correct = selectedAnswer === question.correctIndex;
            } else {
                userAnswer = fillInAnswer.trim();
                correct = fillInAnswer.trim().toLowerCase() === question.correctAnswer?.toLowerCase();
            }

            const newAttemptCount = attemptCount + 1;
            setAttemptCount(newAttemptCount);
            setIsCorrect(correct);
            setShowResult(true);

            // Submit to backend
            await api.submitAnswer({
                user_id: uid,
                subtopic_id: subtopicId,
                question_text: question.question,
                user_answer: userAnswer.toString(),
                is_correct: correct,
                attempt_number: newAttemptCount,
            });

            if (correct) {
                setHasAnsweredCorrectly(true);
                // Notify parent that question was answered correctly
                setTimeout(() => {
                    onCorrect();
                }, 2000);
            }
        } catch (error) {
            console.error('Failed to submit answer:', error);
        } finally {
            setIsSubmitting(false);
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

    return (
        <div className="my-6 p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20">
            {/* Question Header */}
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
                        {question.question}
                    </p>
                </div>
            </div>

            {/* MCQ Options */}
            {question.questionType === 'mcq' && question.options && (
                <div className="space-y-2 mb-5">
                    {question.options.map((option, index) => {
                        const isSelected = selectedAnswer === index;
                        const isCorrectAnswer = index === question.correctIndex;

                        let optionState = 'default';
                        if (showResult || hasAnsweredCorrectly) {
                            if (isCorrectAnswer) optionState = 'correct';
                            else if (isSelected && !isCorrectAnswer) optionState = 'incorrect';
                        } else if (isSelected) {
                            optionState = 'selected';
                        }

                        return (
                            <motion.button
                                key={index}
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
                                {/* Letter indicator */}
                                <div className={cn(
                                    "w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold transition-colors flex-shrink-0",
                                    optionState === 'default' && "bg-muted text-muted-foreground",
                                    optionState === 'selected' && "bg-primary text-primary-foreground",
                                    optionState === 'correct' && "bg-complete text-complete-foreground",
                                    optionState === 'incorrect' && "bg-destructive text-destructive-foreground"
                                )}>
                                    {showResult && isCorrectAnswer ? (
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
                                    {option}
                                </span>
                            </motion.button>
                        );
                    })}
                </div>
            )}

            {/* Fill in the Blank */}
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

            {/* Result & Explanation */}
            <AnimatePresence>
                {showResult && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="overflow-hidden"
                    >
                        <div className={cn(
                            "p-5 rounded-xl border-2",
                            isCorrect
                                ? "bg-complete/10 border-complete/30"
                                : "bg-accent border-border"
                        )}>
                            <div className="flex items-start gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                                    isCorrect ? "bg-complete/20" : "bg-primary/20"
                                )}>
                                    {isCorrect ? (
                                        <Check className="w-5 h-5 text-complete" />
                                    ) : (
                                        <Lightbulb className="w-5 h-5 text-primary" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className={cn(
                                        "font-semibold mb-2 text-base",
                                        isCorrect ? "text-complete" : "text-foreground"
                                    )}>
                                        {isCorrect ? "Correct! Well done! 🎉" : "Not quite right"}
                                    </p>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {isCorrect ? question.explanations.correct : (
                                            question.explanations.incorrect?.[attemptCount - 1] || question.explanations.correct
                                        )}
                                    </p>
                                    {attemptCount >= 4 && !isCorrect && (
                                        <p className="text-xs text-muted-foreground mt-2 italic">
                                            Hint: {question.explanations.correct}
                                        </p>
                                    )}
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
                transition={{ delay: 0.2 }}
            >
                {!hasAnsweredCorrectly ? (
                    showResult && !isCorrect ? (
                        <button
                            onClick={handleTryAgain}
                            className="w-full h-14 rounded-xl font-medium text-base transition-all duration-300 bg-primary text-primary-foreground hover:scale-[1.01] hover:shadow-lg"
                        >
                            Try Again
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={
                                isSubmitting ||
                                (question.questionType === 'mcq' && selectedAnswer === null) ||
                                (question.questionType === 'fill_in_blank' && !fillInAnswer.trim())
                            }
                            className={cn(
                                "w-full h-14 rounded-xl font-medium text-base transition-all duration-300",
                                (selectedAnswer !== null || fillInAnswer.trim()) && !isSubmitting
                                    ? "bg-primary text-primary-foreground hover:scale-[1.01] hover:shadow-lg"
                                    : "bg-muted text-muted-foreground cursor-not-allowed"
                            )}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                        </button>
                    )
                ) : (
                    <div className="p-4 rounded-xl bg-complete/10 text-complete text-center font-medium">
                        ✓ Question completed! Continue to next section
                    </div>
                )}
            </motion.div>
        </div>
    );
}
