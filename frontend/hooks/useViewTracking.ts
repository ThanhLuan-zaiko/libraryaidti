'use client';

import { useEffect, useRef } from 'react';
import apiClient from '@/services/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Custom hook to track article views with 30-second minimum duration requirement
 * Features:
 * - Tracks time spent on page
 * - Handles tab visibility changes (Page Visibility API)
 * - Accumulates time when user switches tabs
 * - Only tracks view after 30 seconds of active viewing
 * - Sends beacon on page unload if >= 30s
 */
export function useViewTracking(articleSlug: string) {
    const trackedRef = useRef<boolean>(false);
    const visibleRef = useRef<boolean>(typeof document !== 'undefined' ? !document.hidden : true);
    const accumulatedTimeRef = useRef<number>(0);
    const lastVisibleTimeRef = useRef<number>(Date.now());
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!articleSlug) return;

        // Reset state for new article
        trackedRef.current = false;
        accumulatedTimeRef.current = 0;
        lastVisibleTimeRef.current = Date.now();
        visibleRef.current = !document.hidden;

        const trackView = async () => {
            if (trackedRef.current) return;

            const now = Date.now();
            const currentActiveTime = visibleRef.current
                ? now - lastVisibleTimeRef.current
                : 0;
            const totalTime = accumulatedTimeRef.current + currentActiveTime;
            const sessionDuration = Math.floor(totalTime / 1000);

            if (sessionDuration >= 30) {
                trackedRef.current = true;
                try {
                    await apiClient.post(`/articles/${articleSlug}/track-view`, {
                        session_duration: sessionDuration,
                    });
                } catch (error) {
                    console.error('[ViewTracking] Failed to track view:', error);
                    // Reset tracked so it can try again if failed?
                    // No, usually best to just log.
                }
            } else {
                // Not enough time yet, schedule another check in 5-10 seconds
                // This handles cases where tab was hidden and visibleRef was false
                if (timerRef.current) clearTimeout(timerRef.current);
                timerRef.current = setTimeout(trackView, 10000);
            }
        };

        // Handle visibility changes (tab switching)
        const handleVisibilityChange = () => {
            const now = Date.now();

            if (document.hidden) {
                visibleRef.current = false;
                const activeTime = now - lastVisibleTimeRef.current;
                accumulatedTimeRef.current += activeTime;

                if (timerRef.current) {
                    clearTimeout(timerRef.current);
                    timerRef.current = null;
                }
            } else {
                visibleRef.current = true;
                lastVisibleTimeRef.current = now;

                // Schedule next check
                const totalTime = accumulatedTimeRef.current;
                if (!trackedRef.current) {
                    const remainingTime = Math.max(1000, 30000 - totalTime);
                    if (timerRef.current) clearTimeout(timerRef.current);
                    timerRef.current = setTimeout(trackView, remainingTime);
                }
            }
        };

        // Initial setup
        if (visibleRef.current) {
            timerRef.current = setTimeout(trackView, 30000);
        } else {
            // If starting hidden, check periodically or wait for focus
            // But let's just wait for focus to be safe and clean
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);

            if (!trackedRef.current) {
                const now = Date.now();
                const currentActiveTime = visibleRef.current ? now - lastVisibleTimeRef.current : 0;
                const totalTime = accumulatedTimeRef.current + currentActiveTime;
                const sessionDuration = Math.floor(totalTime / 1000);

                if (sessionDuration >= 30) {
                    const data = JSON.stringify({ session_duration: sessionDuration });
                    const blob = new Blob([data], { type: 'application/json' });
                    navigator.sendBeacon(`${API_URL}/articles/${articleSlug}/track-view`, blob);
                }
            }
        };
    }, [articleSlug]);
}
