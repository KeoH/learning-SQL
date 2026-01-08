import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SidebarProvider, useSidebar } from './SidebarContext';

const TestComponent = () => {
    const { isCollapsed, toggle, isMobileOpen, toggleMobile } = useSidebar();
    return (
        <div>
            <span data-testid="collapsed">{isCollapsed.toString()}</span>
            <span data-testid="mobile">{isMobileOpen.toString()}</span>
            <button onClick={toggle}>Toggle Desktop</button>
            <button onClick={toggleMobile}>Toggle Mobile</button>
        </div>
    );
};

describe('SidebarContext', () => {
    it('provides default values', () => {
        render(
            <SidebarProvider>
                <TestComponent />
            </SidebarProvider>
        );

        expect(screen.getByTestId('collapsed').textContent).toBe('false');
        expect(screen.getByTestId('mobile').textContent).toBe('false');
    });

    it('toggles collapsed state', async () => {
        render(
            <SidebarProvider>
                <TestComponent />
            </SidebarProvider>
        );

        const toggleBtn = screen.getByText('Toggle Desktop');
        
        await act(async () => {
            toggleBtn.click();
        });
        expect(screen.getByTestId('collapsed').textContent).toBe('true');

        await act(async () => {
            toggleBtn.click();
        });
        expect(screen.getByTestId('collapsed').textContent).toBe('false');
    });

    it('toggles mobile state', async () => {
        render(
            <SidebarProvider>
                <TestComponent />
            </SidebarProvider>
        );

        const toggleBtn = screen.getByText('Toggle Mobile');
        
        await act(async () => {
            toggleBtn.click();
        });
        expect(screen.getByTestId('mobile').textContent).toBe('true');

        await act(async () => {
            toggleBtn.click();
        });
        expect(screen.getByTestId('mobile').textContent).toBe('false');
    });

    it('throws error when used outside of provider', () => {
        // Set up console.error spy before any rendering to suppress expected error output
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        try {
            expect(() => render(<TestComponent />)).toThrow('useSidebar must be used within a SidebarProvider');
        } finally {
            // Always restore the spy, even if the test fails
            consoleSpy.mockRestore();
        }
    });
});
