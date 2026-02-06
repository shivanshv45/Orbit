import { motion } from 'framer-motion';
import { Zap, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CameraFeedbackProps {
    metrics: {
        engagement: number;
        focus_score: number;
        confusion_level: number;
    } | null;
    expanded?: boolean;
}

export function CameraFeedback({ metrics, expanded = false }: CameraFeedbackProps) {
    if (!metrics) return null;

    const score = Math.round(
        (metrics.engagement * 0.4) +
        (metrics.focus_score * 0.4) +
        ((100 - metrics.confusion_level) * 0.2)
    );

    const color = score > 70 ? 'text-green-500' : score > 45 ? 'text-yellow-500' : 'text-red-500';
    const bgColor = score > 70 ? 'bg-green-500' : score > 45 ? 'bg-yellow-500' : 'bg-red-500';
    const borderColor = score > 70 ? 'border-green-500/20' : score > 45 ? 'border-yellow-500/20' : 'border-red-500/20';

    const getStatus = (s: number) => {
        if (s === 0) return 'Looking for face... 👀';
        if (s > 80) return 'Deep Focus 🧠';
        if (s > 60) return 'Engaged ✨';
        if (s > 45) return 'Attentive 👁️';
        return 'Distracted 😴';
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "flex items-center gap-3 bg-background/80 backdrop-blur-md border rounded-2xl shadow-lg transition-all duration-300 overflow-hidden",
                borderColor,
                expanded ? "px-4 py-3" : "px-2 py-1.5"
            )}
        >

            <div className="relative w-10 h-10 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                        className="text-muted/20"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                    />
                    <motion.path
                        className={color}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray={`${score}, 100`}
                        initial={{ strokeDasharray: "0, 100" }}
                        animate={{ strokeDasharray: `${score}, 100` }}
                        transition={{ type: "spring", stiffness: 50, damping: 15 }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={cn("text-[10px] font-bold", color)}>{score}</span>
                </div>
            </div>


            {expanded && (
                <div className="flex flex-col min-w-[100px]">
                    <span className={cn("text-sm font-bold", color)}>
                        {getStatus(score)}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground" title="Engagement">
                            <Zap className="w-3 h-3" />
                            {Math.round(metrics.engagement)}%
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground" title="Focus">
                            <Eye className="w-3 h-3" />
                            {Math.round(metrics.focus_score)}%
                        </div>
                    </div>
                </div>
            )}


            {!expanded && (
                <div className={cn("w-2 h-2 rounded-full animate-pulse", bgColor)} />
            )}
        </motion.div>
    );
}
