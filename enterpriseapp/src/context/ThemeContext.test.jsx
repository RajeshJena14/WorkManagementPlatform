import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThemeProvider, useTheme } from './ThemeContext';

// 1. Create a dummy component to consume the context
const DummyComponent = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    return (
        <div>
            <span data-testid="theme-status">{isDarkMode ? 'Dark' : 'Light'}</span>
            <button onClick={toggleTheme}>Toggle Theme</button>
        </div>
    );
};

describe('ThemeContext', () => {
    beforeEach(() => {
        // Clear localStorage before every test
        window.localStorage.clear();

        // Reset the HTML document class
        document.documentElement.className = '';

        // Mock window.matchMedia (jsdom doesn't support this natively)
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation(query => ({
                matches: false, // Default to pretending the OS is in Light Mode
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        });
    });

    it('should initialize with light mode by default (no local storage, OS prefers light)', () => {
        render(
            <ThemeProvider>
                <DummyComponent />
            </ThemeProvider>
        );

        // Check Context State
        expect(screen.getByTestId('theme-status').textContent).toBe('Light');
        // Check DOM
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should initialize with dark mode if local storage has theme=dark', () => {
        // Set up the environment before rendering
        window.localStorage.setItem('theme', 'dark');

        render(
            <ThemeProvider>
                <DummyComponent />
            </ThemeProvider>
        );

        expect(screen.getByTestId('theme-status').textContent).toBe('Dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should initialize with dark mode if OS prefers dark mode (and no local storage exists)', () => {
        // Override our mock to pretend the user's Mac/Windows is set to Dark Mode
        window.matchMedia = vi.fn().mockImplementation(() => ({
            matches: true,
        }));

        render(
            <ThemeProvider>
                <DummyComponent />
            </ThemeProvider>
        );

        expect(screen.getByTestId('theme-status').textContent).toBe('Dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should initialize with light mode if local storage has theme=light, even if OS prefers dark mode', () => {
        // 1. User previously chose light mode
        window.localStorage.setItem('theme', 'light');

        // 2. But their computer/OS is set to Dark Mode
        window.matchMedia = vi.fn().mockImplementation(() => ({
            matches: true,
        }));

        render(
            <ThemeProvider>
                <DummyComponent />
            </ThemeProvider>
        );

        // 3. Local storage must win!
        expect(screen.getByTestId('theme-status').textContent).toBe('Light');
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should initialize with light mode if local storage has an unrecognized value', () => {
        window.localStorage.setItem('theme', 'purple-dinosaur');

        render(
            <ThemeProvider>
                <DummyComponent />
            </ThemeProvider>
        );

        expect(screen.getByTestId('theme-status').textContent).toBe('Light');
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should toggle theme, update the DOM, and save to localStorage when toggleTheme is called', () => {
        render(
            <ThemeProvider>
                <DummyComponent />
            </ThemeProvider>
        );

        // 1. Initial State: Light
        expect(screen.getByTestId('theme-status').textContent).toBe('Light');

        // 2. Click the toggle button
        fireEvent.click(screen.getByRole('button', { name: 'Toggle Theme' }));

        // 3. Verify changes to Dark Mode
        expect(screen.getByTestId('theme-status').textContent).toBe('Dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(window.localStorage.getItem('theme')).toBe('dark');

        // 4. Click the toggle button again
        fireEvent.click(screen.getByRole('button', { name: 'Toggle Theme' }));

        // 5. Verify changes back to Light Mode
        expect(screen.getByTestId('theme-status').textContent).toBe('Light');
        expect(document.documentElement.classList.contains('dark')).toBe(false);
        expect(window.localStorage.getItem('theme')).toBe('light');
    });
});