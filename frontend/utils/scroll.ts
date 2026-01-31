/**
 * Utility functions for managing scroll position restoration.
 * Uses sessionStorage to persist scroll positions across page navigations.
 */

const SCROLL_STORAGE_KEY_PREFIX = 'scroll_position_';

/**
 * Saves the current window scroll position for a specific key (e.g. pathname + search).
 */
export const saveScrollPosition = (key: string) => {
    if (typeof window === 'undefined') return;
    const position = {
        x: window.scrollX,
        y: window.scrollY,
        timestamp: Date.now(),
    };
    sessionStorage.setItem(`${SCROLL_STORAGE_KEY_PREFIX}${key}`, JSON.stringify(position));
};

/**
 * Retrieves the saved scroll position for a specific key.
 */
export const getSavedScrollPosition = (key: string): { x: number; y: number; timestamp: number } | null => {
    if (typeof window === 'undefined') return null;
    const saved = sessionStorage.getItem(`${SCROLL_STORAGE_KEY_PREFIX}${key}`);
    if (!saved) return null;
    try {
        return JSON.parse(saved);
    } catch (e) {
        return null;
    }
};

/**
 * Clears the saved scroll position for a specific key.
 */
export const clearScrollPosition = (key: string) => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(`${SCROLL_STORAGE_KEY_PREFIX}${key}`);
};

/**
 * Performs a smooth or instant scroll to the saved position.
 */
export const scrollToSavedPosition = (key: string, behavior: ScrollBehavior = 'auto'): boolean => {
    const position = getSavedScrollPosition(key);
    if (position) {
        window.scrollTo({
            left: position.x,
            top: position.y,
            behavior,
        });
        return true;
    }
    return false;
};
