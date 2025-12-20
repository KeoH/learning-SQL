'use client';

import React, { createContext, useContext, useState } from 'react';

interface SidebarContextType {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
    toggle: () => void;
    isMobileOpen: boolean;
    setIsMobileOpen: (value: boolean) => void;
    toggleMobile: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Close mobile sidebar on navigation (handled by checking pathname change in Sidebar component too)
    const toggle = () => setIsCollapsed(!isCollapsed);
    const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

    return (
        <SidebarContext.Provider 
            value={{ 
                isCollapsed, 
                setIsCollapsed, 
                toggle, 
                isMobileOpen, 
                setIsMobileOpen, 
                toggleMobile 
            }}
        >
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
}
