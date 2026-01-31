import { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface SimulationBlockProps {
    html: string;
    description?: string;
}

function sanitizeHtml(html: string): string {
    let cleaned = html.trim();

    if (cleaned.startsWith('```html')) {
        cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
    }

    return cleaned.trim();
}

export function SimulationBlock({ html, description }: SimulationBlockProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        setError(null);

        const cleanHtml = sanitizeHtml(html);

        if (!cleanHtml) {
            setError('No simulation content available');
            return;
        }

        try {
            container.innerHTML = cleanHtml;

            const scripts = container.querySelectorAll('script');

            scripts.forEach((oldScript, idx) => {
                try {
                    const newScript = document.createElement('script');
                    Array.from(oldScript.attributes).forEach((attr) => {
                        newScript.setAttribute(attr.name, attr.value);
                    });

                    let scriptContent = oldScript.textContent || '';

                    const isAlreadyWrapped = scriptContent.trim().startsWith('(function()') ||
                        scriptContent.trim().startsWith('(()');

                    if (!isAlreadyWrapped && scriptContent.trim().length > 0) {
                        scriptContent = `(function() {\ntry {\n${scriptContent}\n} catch(e) { console.warn('Simulation script error:', e); }\n})();`;
                    }

                    newScript.textContent = scriptContent;

                    if (oldScript.parentNode) {
                        oldScript.parentNode.replaceChild(newScript, oldScript);
                    }
                } catch (scriptError) {
                    console.warn(`Script ${idx + 1} failed to execute:`, scriptError);
                }
            });
        } catch (err) {
            console.error('Simulation render error:', err);
            setError('Failed to load simulation');
            container.innerHTML = '';
        }

        return () => {
            container.innerHTML = '';
        };
    }, [html]);

    if (error) {
        return (
            <div className="my-6 w-full">
                {description && (
                    <p className="text-sm text-muted-foreground mb-4">{description}</p>
                )}
                <div className="w-full rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    <p className="text-sm text-yellow-200">{error}</p>
                </div>
            </div>
        );
    }

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
