import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Home from './freelanceflow/src/app/page';

const root = document.getElementById('app');
if (root) {
    createRoot(root).render(
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <Home />
            <Toaster position="bottom-right" richColors closeButton />
        </ThemeProvider>,
    );
}