import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Calendar, MoreVertical, Pin, Archive, Trash2, PinOff, Inbox } from 'lucide-react';
import { useCurriculums } from '@/hooks/useCurriculums';
import { useNavigate } from 'react-router-dom';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { createOrGetUser } from '@/logic/userSession';
import { toast } from 'sonner';
import { useState, useEffect, useMemo } from 'react';

const PinIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 3H8V5H10V11L8 14V16H11V21H13V16H16V14L14 11V5H16V3Z" className="fill-current" />
        <path d="M16 3H8V5H10V11L8 14V16H11V21H13V16H16V14L14 11V5H16V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const BookIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.5 2H20V22H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 6V11" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" strokeLinecap="round" />
    </svg>
);

interface CurriculumListModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CurriculumListModal({ isOpen, onClose }: CurriculumListModalProps) {
    const { data, isLoading, error } = useCurriculums();
    const navigate = useNavigate();
    // const queryClient = useQueryClient(); // Not needed for local pin/archive updates unless deleting
    const queryClient = useQueryClient();
    const { user, isLoaded } = useUser();
    const { uid } = createOrGetUser(user ? { id: user.id, fullName: user.fullName } : null, isLoaded);

    const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
    const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
    const [showArchived, setShowArchived] = useState(false);

    // Load state from localStorage on mount/user change
    useEffect(() => {
        if (!uid) return;

        try {
            const pinned = localStorage.getItem(`pinned_curriculums_${uid}`);
            if (pinned) setPinnedIds(new Set(JSON.parse(pinned)));

            const archived = localStorage.getItem(`archived_curriculums_${uid}`);
            if (archived) setArchivedIds(new Set(JSON.parse(archived)));
        } catch (e) {
            console.error("Failed to load local preference", e);
        }
    }, [uid]);

    // Save state helper
    const saveState = (pinned: Set<string>, archived: Set<string>) => {
        if (!uid) return;
        localStorage.setItem(`pinned_curriculums_${uid}`, JSON.stringify(Array.from(pinned)));
        localStorage.setItem(`archived_curriculums_${uid}`, JSON.stringify(Array.from(archived)));
    };

    const handleSelectCurriculum = (curriculumId: string) => {
        navigate(`/curriculum?id=${curriculumId}`);
        onClose();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const handlePin = (curriculumId: string, isPinned: boolean) => {
        const newPinned = new Set(pinnedIds);
        if (isPinned) {
            newPinned.delete(curriculumId);
            toast.success("Curriculum unpinned");
        } else {
            newPinned.add(curriculumId);
            toast.success("Curriculum pinned");
        }
        setPinnedIds(newPinned);
        saveState(newPinned, archivedIds);
    };

    const handleArchive = (curriculumId: string, isArchived: boolean) => {
        const newArchived = new Set(archivedIds);
        if (isArchived) {
            newArchived.delete(curriculumId); // In case we want to unarchive
            toast.success("Curriculum unarchived");
        } else {
            newArchived.add(curriculumId);
            toast.success("Curriculum archived");
        }
        setArchivedIds(newArchived);
        saveState(pinnedIds, newArchived);
    };

    const handleDelete = async (curriculumId: string) => {
        if (!uid) return;
        if (!confirm("Are you sure you want to delete this curriculum? This action cannot be undone.")) return;

        try {
            await api.deleteCurriculum(curriculumId, uid);
            queryClient.invalidateQueries({ queryKey: ['curriculums', uid] });

            // Also cleanup local state
            const newPinned = new Set(pinnedIds);
            newPinned.delete(curriculumId);
            const newArchived = new Set(archivedIds);
            newArchived.delete(curriculumId);
            setPinnedIds(newPinned);
            setArchivedIds(newArchived);
            saveState(newPinned, newArchived);

            toast.success("Curriculum deleted");
        } catch (error) {
            toast.error("Failed to delete curriculum");
        }
    };

    // Filter and Sort
    const processedCurriculums = useMemo(() => {
        if (!data?.curriculums) return [];

        let filtered = data.curriculums.filter(c => {
            const isArchived = archivedIds.has(c.id);
            return showArchived ? isArchived : !isArchived;
        });

        if (!showArchived) {
            filtered.sort((a, b) => {
                const aPinned = pinnedIds.has(a.id);
                const bPinned = pinnedIds.has(b.id);
                if (aPinned === bPinned) return 0; // Keep original created_at sort order from DB
                return aPinned ? -1 : 1;
            });
        }

        return filtered;
    }, [data, pinnedIds, archivedIds, showArchived]);

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
                        <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-border">
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground">
                                        {showArchived ? "Archived Curriculums" : "Your Curriculums"}
                                    </h2>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {showArchived ? "View your archived learning paths" : "Select a curriculum to continue learning"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowArchived(!showArchived)}
                                        className={`p-2 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium ${showArchived ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        {showArchived ? (
                                            <>
                                                <Inbox className="w-4 h-4" />
                                                View Active
                                            </>
                                        ) : (
                                            <>
                                                <Archive className="w-4 h-4" />
                                                Archived
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-xl hover:bg-muted transition-colors"
                                    >
                                        <X className="w-5 h-5 text-muted-foreground" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto max-h-[60vh] min-h-[300px]">
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

                                {!isLoading && processedCurriculums.length === 0 && (
                                    <div className="text-center py-12">
                                        {showArchived ? (
                                            <Archive className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                                        ) : (
                                            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                                        )}
                                        <h3 className="text-lg font-semibold text-foreground mb-2">
                                            {showArchived ? "No archived curriculums" : "No curriculums yet"}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {showArchived ? "Archived items will appear here" : "Upload your first study material to get started"}
                                        </p>
                                    </div>
                                )}

                                {!isLoading && processedCurriculums.length > 0 && (
                                    <div className="space-y-3">
                                        {processedCurriculums.map((curriculum) => {
                                            const isPinned = pinnedIds.has(curriculum.id);
                                            const isArchived = archivedIds.has(curriculum.id);

                                            return (
                                                <motion.div
                                                    key={curriculum.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="group relative"
                                                >
                                                    <div
                                                        onClick={() => handleSelectCurriculum(curriculum.id)}
                                                        className={`w-full p-5 rounded-xl border-2 bg-card hover:bg-accent/30 transition-all duration-200 flex items-center justify-between cursor-pointer ${isPinned
                                                            ? 'border-primary/50 shadow-[0_0_15px_-5px_hsl(var(--primary)/0.3)]'
                                                            : 'border-border hover:border-primary/50'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isPinned ? 'bg-primary/20' : 'bg-primary/10'
                                                                }`}>

                                                                {isPinned ? (
                                                                    <PinIcon className="w-6 h-6 text-primary fill-primary/20" />
                                                                ) : (
                                                                    <BookIcon className="w-6 h-6 text-primary" />
                                                                )}
                                                            </div>
                                                            <div className="text-left flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="font-semibold text-foreground text-lg mb-1 truncate">
                                                                        {curriculum.title}
                                                                    </h4>
                                                                    {isPinned && (
                                                                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary/20 text-primary">Pinned</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                    <Calendar className="w-4 h-4 flex-shrink-0" />
                                                                    <span>Created {formatDate(curriculum.created_at)}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <button className="p-2 rounded-lg hover:bg-background/80 text-muted-foreground hover:text-foreground transition-colors focus:outline-none">
                                                                        <MoreVertical className="w-5 h-5" />
                                                                    </button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-[12rem] bg-popover z-[150]">
                                                                    <DropdownMenuItem onSelect={() => handlePin(curriculum.id, isPinned)}>
                                                                        {isPinned ? (
                                                                            <>
                                                                                <PinOff className="w-4 h-4 mr-2" />
                                                                                Unpin
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Pin className="w-4 h-4 mr-2" />
                                                                                Pin to Top
                                                                            </>
                                                                        )}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onSelect={() => handleArchive(curriculum.id, isArchived)}>
                                                                        {isArchived ? (
                                                                            <>
                                                                                <Inbox className="w-4 h-4 mr-2" />
                                                                                Unarchive
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Archive className="w-4 h-4 mr-2" />
                                                                                Archive
                                                                            </>
                                                                        )}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onSelect={() => handleDelete(curriculum.id)} className="text-destructive focus:text-destructive">
                                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )
            }
        </AnimatePresence >
    );
}
