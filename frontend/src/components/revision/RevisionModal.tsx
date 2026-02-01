import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, CheckCircle, XCircle, BookOpen, Trophy, Target, Sparkles, Calculator } from 'lucide-react';
import { api } from '@/lib/api';
import { formatFormula } from '@/lib/formatFormula';

interface RevisionNote {
    topic: string;
    keyPoints: string[];
    summary: string;
    formulas?: string[];
    tips?: string[];
}

interface RevisionQuestion {
    id: string;
    question: string;
    questionType: 'mcq' | 'fill_in_blank';
    options?: string[];
    correctIndex?: number;
    correctAnswer?: string;
    acceptedAnswers?: string[];
    explanation: string;
    difficulty: 'easy' | 'medium' | 'hard';
    relatedTopic: string;
}

interface RevisionModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    curriculumId: string;
    milestone: number;
}

type Phase = 'loading' | 'notes' | 'test' | 'results';

interface QuestionState {
    answered: boolean;
    attempts: number;
    correct: boolean;
    selectedAnswer?: number | string;
    showAnswer: boolean;
}

const renderFormattedText = (text: string) => {
    if (!text) return null;

    const processedText = text.replace(
        /([.?!])\s+(Given|Substituting|To calculate|Calculate|Where|Thus|Therefore|Hence|Note|Step \d|Here)/g,
        "$1\n\n$2"
    );

    return processedText.split('\n').map((line, i) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return <br key={i} />;

        const isFormula = trimmedLine.includes('=') && (
            trimmedLine.includes('∂') ||
            trimmedLine.includes('∫') ||
            trimmedLine.includes('∑') ||
            trimmedLine.length > 20
        );

        const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);

        return (
            <p key={i} className={`mb-3 last:mb-0 leading-relaxed ${isFormula ? 'font-mono text-sm bg-muted/50 p-3 rounded-lg border-l-4 border-primary my-3 shadow-sm' : ''}`}>
                {parts.map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={j} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
                    }
                    if (part.startsWith('`') && part.endsWith('`')) {
                        return <code key={j} className="bg-muted px-1.5 py-0.5 rounded font-mono text-primary text-xs border border-border">{part.slice(1, -1)}</code>;
                    }
                    return <span key={j}>{part}</span>;
                })}
            </p>
        );
    });
};

export function RevisionModal({ isOpen, onClose, userId, curriculumId, milestone }: RevisionModalProps) {
    const [phase, setPhase] = useState<Phase>('loading');
    const [notes, setNotes] = useState<RevisionNote[]>([]);
    const [questions, setQuestions] = useState<RevisionQuestion[]>([]);
    const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [questionStates, setQuestionStates] = useState<Map<string, QuestionState>>(new Map());
    const [fillInAnswer, setFillInAnswer] = useState('');
    const [score, setScore] = useState({ correct: 0, total: 0 });

    const loadRevisionContent = useCallback(async () => {
        const cacheKey = `revision_${userId}_${curriculumId}_${milestone}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
            try {
                const data = JSON.parse(cached);
                setNotes(data.notes);
                setQuestions(data.questions);

                const states = new Map<string, QuestionState>();
                data.questions.forEach((q: RevisionQuestion) => {
                    states.set(q.id, { answered: false, attempts: 0, correct: false, showAnswer: false });
                });

                if (data.progress) {
                    setCurrentNoteIndex(data.progress.noteIndex || 0);
                    setCurrentQuestionIndex(data.progress.questionIndex || 0);
                    setPhase(data.progress.phase || 'notes');
                    if (data.progress.questionStates) {
                        const savedStates = new Map<string, QuestionState>(JSON.parse(data.progress.questionStates));
                        setQuestionStates(savedStates);
                    } else {
                        setQuestionStates(states);
                    }
                    if (data.progress.score) setScore(data.progress.score);
                } else {
                    setQuestionStates(states);
                    setPhase('notes');
                }
                return;
            } catch (e) {
                console.error("Cache parse error", e);
                localStorage.removeItem(cacheKey);
            }
        }

        setPhase('loading');
        try {
            const data = await api.generateRevision(userId, curriculumId, milestone);
            setNotes(data.notes);
            setQuestions(data.questions);

            const states = new Map<string, QuestionState>();
            data.questions.forEach((q: RevisionQuestion) => {
                states.set(q.id, { answered: false, attempts: 0, correct: false, showAnswer: false });
            });
            setQuestionStates(states);

            localStorage.setItem(cacheKey, JSON.stringify({
                notes: data.notes,
                questions: data.questions,
                timestamp: Date.now()
            }));

            setPhase('notes');
        } catch (error) {
            console.error('Failed to load revision:', error);
        }
    }, [userId, curriculumId, milestone]);

    useEffect(() => {
        if (notes.length === 0 && questions.length === 0) return;

        const cacheKey = `revision_${userId}_${curriculumId}_${milestone}`;
        const currentCache = localStorage.getItem(cacheKey);

        if (currentCache) {
            const data = JSON.parse(currentCache);
            data.progress = {
                phase,
                noteIndex: currentNoteIndex,
                questionIndex: currentQuestionIndex,
                score,
                questionStates: JSON.stringify(Array.from(questionStates.entries()))
            };
            localStorage.setItem(cacheKey, JSON.stringify(data));
        }
    }, [phase, currentNoteIndex, currentQuestionIndex, score, questionStates, userId, curriculumId, milestone, notes.length, questions.length]);

    useEffect(() => {
        if (isOpen) {
            loadRevisionContent();
        }
    }, [isOpen, loadRevisionContent]);

    const handleMCQAnswer = (questionId: string, optionIndex: number) => {
        const question = questions.find(q => q.id === questionId);
        if (!question) return;

        const state = questionStates.get(questionId);
        if (!state || state.showAnswer) return;

        const isCorrect = optionIndex === question.correctIndex;
        const newAttempts = state.attempts + 1;
        const shouldShowAnswer = isCorrect || newAttempts >= 2;

        setQuestionStates(new Map(questionStates.set(questionId, {
            answered: true,
            attempts: newAttempts,
            correct: isCorrect,
            selectedAnswer: optionIndex,
            showAnswer: shouldShowAnswer
        })));

        if (shouldShowAnswer && !state.correct) {
            setScore(prev => ({
                correct: prev.correct + (isCorrect ? 1 : 0),
                total: prev.total + 1
            }));
        }
    };

    const handleFillInSubmit = (questionId: string) => {
        const question = questions.find(q => q.id === questionId);
        if (!question || !fillInAnswer.trim()) return;

        const state = questionStates.get(questionId);
        if (!state || state.showAnswer) return;

        const accepted = question.acceptedAnswers || [question.correctAnswer || ''];
        const isCorrect = accepted.some(a =>
            a.toLowerCase().trim() === fillInAnswer.toLowerCase().trim()
        );
        const newAttempts = state.attempts + 1;
        const shouldShowAnswer = isCorrect || newAttempts >= 2;

        setQuestionStates(new Map(questionStates.set(questionId, {
            answered: true,
            attempts: newAttempts,
            correct: isCorrect,
            selectedAnswer: fillInAnswer,
            showAnswer: shouldShowAnswer
        })));

        if (shouldShowAnswer && !state.correct) {
            setScore(prev => ({
                correct: prev.correct + (isCorrect ? 1 : 0),
                total: prev.total + 1
            }));
        }

        setFillInAnswer('');
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setPhase('results');
        }
    };

    const handleFinishNotes = () => {
        setPhase('test');
        setCurrentQuestionIndex(0);
    };

    const handleClose = () => {
        if (phase === 'results') {
            api.submitRevisionResults({
                userId,
                curriculumId,
                milestone,
                score: questions.length > 0 ? (score.correct / questions.length) * 100 : 0,
                totalQuestions: questions.length,
                correctAnswers: score.correct
            });

            // Clear cache on successful completion
            const cacheKey = `revision_${userId}_${curriculumId}_${milestone}`;
            localStorage.removeItem(cacheKey);
        }
        onClose();
    };

    if (!isOpen) return null;

    const currentQuestion = questions[currentQuestionIndex];
    const currentState = currentQuestion ? questionStates.get(currentQuestion.id) : undefined;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                >
                    <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-cyan-500/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                                {milestone === 100 ? <Trophy className="w-5 h-5 text-primary" /> : <Target className="w-5 h-5 text-primary" />}
                            </div>
                            <div>
                                <h2 className="font-bold text-foreground">
                                    {milestone === 100 ? 'Final Test' : `${milestone}% Progress Revision`}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {phase === 'notes' && `Note ${currentNoteIndex + 1} of ${notes.length}`}
                                    {phase === 'test' && `Question ${currentQuestionIndex + 1} of ${questions.length}`}
                                    {phase === 'results' && 'Test Complete!'}
                                </p>
                            </div>
                        </div>
                        <button onClick={handleClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {phase === 'loading' && (
                            <div className="flex flex-col items-center justify-center h-64 gap-4">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                >
                                    <Sparkles className="w-12 h-12 text-primary" />
                                </motion.div>
                                <p className="text-muted-foreground">Preparing your revision...</p>
                            </div>
                        )}

                        {phase === 'notes' && notes[currentNoteIndex] && (
                            <motion.div
                                key={currentNoteIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <BookOpen className="w-5 h-5 text-primary" />
                                    <h3 className="text-xl font-semibold text-foreground">{notes[currentNoteIndex].topic}</h3>
                                </div>

                                <div className="bg-muted/30 rounded-xl p-4 border border-border">
                                    <p className="text-foreground leading-relaxed">{notes[currentNoteIndex].summary}</p>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-medium text-foreground flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        Key Points
                                    </h4>
                                    <ul className="space-y-2">
                                        {notes[currentNoteIndex].keyPoints.map((point, i) => (
                                            <motion.li
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="flex items-start gap-2 text-muted-foreground"
                                            >
                                                <span className="text-primary mt-1">•</span>
                                                {point}
                                            </motion.li>
                                        ))}
                                    </ul>
                                </div>

                                {notes[currentNoteIndex].formulas && notes[currentNoteIndex].formulas!.length > 0 && (
                                    <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl p-5 border border-indigo-500/20 shadow-sm">
                                        <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-base">
                                            <Calculator className="w-4 h-4 text-indigo-500" />
                                            Key Formulas
                                        </h4>
                                        <div className="space-y-3">
                                            {notes[currentNoteIndex].formulas!.map((f, i) => (
                                                <div
                                                    key={i}
                                                    className="bg-background/60 backdrop-blur-sm rounded-lg p-3.5 border border-indigo-500/10 hover:border-indigo-500/30 transition-colors"
                                                >
                                                    <p className="font-serif text-base text-indigo-950 dark:text-indigo-100 block leading-relaxed break-words whitespace-pre-wrap">
                                                        {formatFormula(f)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {notes[currentNoteIndex].tips && notes[currentNoteIndex].tips!.length > 0 && (
                                    <div className="bg-cyan-500/5 rounded-xl p-4 border border-cyan-500/20">
                                        <h4 className="font-medium text-foreground mb-2">💡 Tips</h4>
                                        <ul className="space-y-1 text-sm text-muted-foreground">
                                            {notes[currentNoteIndex].tips!.map((tip, i) => (
                                                <li key={i}>• {tip}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {phase === 'test' && currentQuestion && (
                            <motion.div
                                key={currentQuestionIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center justify-between">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${currentQuestion.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                                        currentQuestion.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-red-500/20 text-red-400'
                                        }`}>
                                        {currentQuestion.difficulty}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{currentQuestion.relatedTopic}</span>
                                </div>

                                <h3 className="text-lg font-medium text-foreground">{currentQuestion.question}</h3>

                                {currentQuestion.questionType === 'mcq' && currentQuestion.options && (
                                    <div className="space-y-3">
                                        {currentQuestion.options.map((option, i) => {
                                            const isSelected = currentState?.selectedAnswer === i;
                                            const isCorrect = i === currentQuestion.correctIndex;
                                            const showResult = currentState?.showAnswer;

                                            return (
                                                <motion.button
                                                    key={i}
                                                    whileHover={!showResult ? { scale: 1.01 } : {}}
                                                    whileTap={!showResult ? { scale: 0.99 } : {}}
                                                    onClick={() => handleMCQAnswer(currentQuestion.id, i)}
                                                    disabled={showResult}
                                                    className={`w-full p-4 rounded-xl text-left transition-all border ${showResult
                                                        ? isCorrect
                                                            ? 'bg-green-500/20 border-green-500/50 text-green-400'
                                                            : isSelected
                                                                ? 'bg-red-500/20 border-red-500/50 text-red-400'
                                                                : 'bg-muted/30 border-border text-muted-foreground'
                                                        : isSelected
                                                            ? 'bg-primary/20 border-primary/50 text-foreground'
                                                            : 'bg-muted/30 border-border hover:border-primary/30 text-foreground'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span>{option}</span>
                                                        {showResult && isCorrect && <CheckCircle className="w-5 h-5 text-green-400" />}
                                                        {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-400" />}
                                                    </div>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                )}

                                {currentQuestion.questionType === 'fill_in_blank' && (
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={fillInAnswer}
                                                onChange={(e) => setFillInAnswer(e.target.value)}
                                                disabled={currentState?.showAnswer}
                                                placeholder="Type your answer..."
                                                className="flex-1 px-4 py-3 rounded-xl bg-muted/30 border border-border focus:border-primary/50 focus:outline-none text-foreground"
                                                onKeyDown={(e) => e.key === 'Enter' && handleFillInSubmit(currentQuestion.id)}
                                            />
                                            {!currentState?.showAnswer && (
                                                <button
                                                    onClick={() => handleFillInSubmit(currentQuestion.id)}
                                                    className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                                                >
                                                    Submit
                                                </button>
                                            )}
                                        </div>
                                        {currentState?.showAnswer && (
                                            <div className={`p-3 rounded-lg ${currentState.correct ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                                <p className={currentState.correct ? 'text-green-400' : 'text-red-400'}>
                                                    {currentState.correct ? 'Correct!' : `Correct answer: ${currentQuestion.correctAnswer}`}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {currentState?.showAnswer && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-muted/30 rounded-xl p-4 border border-border"
                                    >
                                        <h4 className="font-medium text-foreground mb-2">Explanation</h4>
                                        <div className="text-base text-foreground/90 leading-relaxed space-y-2">
                                            {renderFormattedText(currentQuestion.explanation)}
                                        </div>
                                    </motion.div>
                                )}

                                {!currentState?.showAnswer && currentState?.attempts === 1 && (
                                    <p className="text-sm text-yellow-400 text-center">One more try remaining!</p>
                                )}
                            </motion.div>
                        )}

                        {phase === 'results' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center space-y-6 py-8"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', delay: 0.2 }}
                                    className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center"
                                >
                                    <Trophy className="w-12 h-12 text-white" />
                                </motion.div>

                                <div>
                                    <h3 className="text-2xl font-bold text-foreground mb-2">
                                        {milestone === 100 ? 'Test Complete!' : 'Revision Complete!'}
                                    </h3>
                                    <p className="text-muted-foreground">Great effort on your {milestone}% milestone</p>
                                </div>

                                <div className="bg-muted/30 rounded-2xl p-6 max-w-sm mx-auto">
                                    <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400 mb-2">
                                        {questions.length > 0 ? Math.round((score.correct / questions.length) * 100) : 0}%
                                    </div>
                                    <p className="text-muted-foreground">
                                        {score.correct} out of {questions.length} correct
                                    </p>
                                </div>

                                <button
                                    onClick={handleClose}
                                    className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                                >
                                    Continue Learning
                                </button>
                            </motion.div>
                        )}
                    </div>

                    {(phase === 'notes' || (phase === 'test' && currentState?.showAnswer)) && (
                        <div className="p-4 border-t border-border flex justify-between items-center">
                            {phase === 'notes' && (
                                <>
                                    <button
                                        onClick={() => setCurrentNoteIndex(prev => Math.max(0, prev - 1))}
                                        disabled={currentNoteIndex === 0}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted disabled:opacity-50 transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Previous
                                    </button>
                                    {currentNoteIndex < notes.length - 1 ? (
                                        <button
                                            onClick={() => setCurrentNoteIndex(prev => prev + 1)}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                        >
                                            Next Note
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleFinishNotes}
                                            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-primary to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity"
                                        >
                                            Start Test
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    )}
                                </>
                            )}
                            {phase === 'test' && currentState?.showAnswer && (
                                <button
                                    onClick={handleNextQuestion}
                                    className="ml-auto flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                >
                                    {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
