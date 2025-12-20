'use client';

import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidRenderProps {
    chart: string;
}

// Initialize mermaid
mermaid.initialize({
    startOnLoad: true,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'inherit',
});

export function MermaidRender({ chart }: MermaidRenderProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ref.current && chart) {
            // Clear previous content
            ref.current.removeAttribute('data-processed');
            ref.current.innerHTML = chart;
            
            // Re-render
            try {
                mermaid.contentLoaded();
                // Alternatively, use mermaid.render if contentLoaded is not enough
                // But since we put the code inside, contentLoaded should find it if we use standard mermaid class
            } catch (err) {
                console.error('Mermaid render error:', err);
            }
        }
    }, [chart]);

    return (
        <div className="mermaid bg-slate-900/50 p-4 rounded-lg overflow-x-auto min-h-[100px] flex justify-center" ref={ref}>
            {chart}
        </div>
    );
}
