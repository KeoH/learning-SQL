import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MermaidRender } from './MermaidRender';
import mermaid from 'mermaid';

// Mock mermaid
vi.mock('mermaid', () => ({
    default: {
        initialize: vi.fn(),
        render: vi.fn(),
    },
}));

describe('MermaidRender', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(mermaid.render).mockResolvedValue({ svg: '<svg>Mocked SVG</svg>' });
    });

    it('renders the diagram container', async () => {
        render(<MermaidRender chart="graph TD; A-->B;" />);
        
        // It initially shows a div where the SVG will be rendered
        const container = screen.getByTestId('mermaid-container');
        expect(container).toBeInTheDocument();
    });

    it('calls mermaid.render on mount', async () => {
        render(<MermaidRender chart="graph TD; A-->B;" />);

        await waitFor(() => {
            expect(mermaid.render).toHaveBeenCalled();
        });
    });

    it('displays the rendered SVG', async () => {
        render(<MermaidRender chart="graph TD; A-->B;" />);

        // Wait for the mocked SVG to appear
        await waitFor(() => {
            expect(screen.getByText('Mocked SVG')).toBeInTheDocument();
        });
    });
});
