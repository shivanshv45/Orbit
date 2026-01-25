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
        scripts.forEach((oldScript) => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach((attr) => {
                newScript.setAttribute(attr.name, attr.value);
            });
            newScript.textContent = oldScript.textContent;
            oldScript.parentNode?.replaceChild(newScript, oldScript);
        });

        return () => {
            container.innerHTML = '';
        };
    }, [html]);

    return (
        <div className="my-6">
            {description && (
                <p className="text-sm text-muted-foreground mb-4">{description}</p>
            )}
            <div
                ref={containerRef}
                className="rounded-2xl overflow-hidden bg-background border border-border"
            />
        </div>
    );
}
