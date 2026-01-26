import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Calendar, ChevronRight } from 'lucide-react';
import { useCurriculums } from '@/hooks/useCurriculums';
import { useNavigate } from 'react-router-dom';

interface CurriculumListModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CurriculumListModal({ isOpen, onClose }: CurriculumListModalProps) {
    const { data, isLoading, error } = useCurriculums();
    const navigate = useNavigate();

    const handleSelectCurriculum = (curriculumId: string) => {
        navigate(`/curriculum?id=${curriculumId}`);
        onClose();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-border">
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground">Your Curriculums</h2>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Select a curriculum to continue learning
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-xl hover:bg-muted transition-colors"
                                >
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto max-h-[60vh]">
                                {isLoading && (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                                    </div>
                                )}

                                {error && (
                                    <div className="text-center py-12">
                                        <p className="text-destructive">Failed to load curriculums</p>
                                        <p className="text-sm text-muted-foreground mt-2">{(error as Error).message}</p>
                                    </div>
                                )}

                                {data && data.curriculums.length === 0 && (
                                    <div className="text-center py-12">
                                        <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold text-foreground mb-2">No curriculums yet</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Upload your first study material to get started
                                        </p>
                                    </div>
                                )}

                                {data && data.curriculums.length > 0 && (
                                    <div className="space-y-3">
                                        {data.curriculums.map((curriculum) => (
                                            <motion.button
                                                key={curriculum.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleSelectCurriculum(curriculum.id)}
                                                className="w-full p-5 rounded-xl border-2 border-border bg-card hover:border-primary/50 hover:bg-accent/30 transition-all duration-200 flex items-center justify-between group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                        <BookOpen className="w-6 h-6 text-primary" />
                                                    </div>
                                                    <div className="text-left">
                                                        <h4 className="font-semibold text-foreground text-lg mb-1">
                                                            {curriculum.title}
                                                        </h4>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>Created {formatDate(curriculum.created_at)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </motion.button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
