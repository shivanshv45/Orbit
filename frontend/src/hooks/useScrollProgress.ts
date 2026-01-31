import { useScroll } from 'framer-motion';
import type { RefObject } from 'react';

/**
 * Hook to track scroll progress within a container element
 * Returns a value between 0 and 1 representing scroll position
 */
export function useScrollProgress(targetRef: RefObject<HTMLElement>) {
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ['start end', 'end start'],
    });

    return scrollYProgress;
}
