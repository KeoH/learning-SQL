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
        const renderDiagram = async () => {
            if (ref.current && chart) {
                try {
                    const result = await mermaid.render('mermaid-' + Math.random().toString(36).substr(2, 9), chart);
                    const { svg } = result;
                    ref.current.innerHTML = svg;
                } catch (err) {
                    console.error('Mermaid render error:', err);
                }
            }
        };
        renderDiagram();
    }, [chart]);

    return (
        <div 
            className="mermaid bg-slate-900/50 p-4 rounded-lg overflow-x-auto min-h-[100px] flex justify-center" 
            ref={ref}
            data-testid="mermaid-container"
        >
            {chart}
        </div>
    );
}
