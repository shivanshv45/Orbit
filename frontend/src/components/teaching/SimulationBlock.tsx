import { useEffect, useRef } from 'react';

interface SimulationBlockProps {
    html: string;
    description?: string;
}

export function SimulationBlock({ html, description }: SimulationBlockProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;



        container.innerHTML = html;



        const scripts = container.querySelectorAll('script');


        scripts.forEach((oldScript, idx) => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach((attr) => {
                newScript.setAttribute(attr.name, attr.value);
            });

            // Get script content
            let scriptContent = oldScript.textContent || '';

            // Auto-wrap in IIFE if not already wrapped to prevent variable collisions
            const isAlreadyWrapped = scriptContent.trim().startsWith('(function()') ||
                scriptContent.trim().startsWith('(()');

            if (!isAlreadyWrapped && scriptContent.trim().length > 0) {
                scriptContent = `(function() {\n${scriptContent}\n})();`;

            }

            newScript.textContent = scriptContent;

            try {
                oldScript.parentNode?.replaceChild(newScript, oldScript);

            } catch (error) {
                console.error(`  ❌ Script ${idx + 1} error:`, error);
            }
        });



        return () => {
            container.innerHTML = '';
        };
    }, [html]);

    return (
        <div className="my-6 w-full">
            {description && (
                <p className="text-sm text-muted-foreground mb-4">{description}</p>
            )}
            <div className="w-full overflow-x-auto rounded-2xl border border-border bg-background">
                <div
                    ref={containerRef}
                    className="min-w-full p-4"
                />
            </div>
        </div>
    );
}
