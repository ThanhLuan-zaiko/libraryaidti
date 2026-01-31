'use client';

import { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { saveScrollPosition, getSavedScrollPosition } from '@/utils/scroll';

export const useScrollRestoration = (dependencies: any[] = [], enabled: boolean = true) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const scrollKey = useMemo(() => {
        const query = searchParams?.toString();
        return query ? `${pathname}?${query}` : pathname;
    }, [pathname, searchParams]);

    const [isRestoring, setIsRestoring] = useState(() => {
        if (typeof window === 'undefined') return false;
        return enabled && !!getSavedScrollPosition(scrollKey);
    });

    const hasRestoredKey = useRef<string | null>(null);
    const isActivelyCorrecting = useRef<boolean>(false);
    const userInteracted = useRef<boolean>(false);
    const restorationStart = useRef<number>(0);
    const lastHeight = useRef<number>(0);
    const animationFrameId = useRef<number | null>(null);

    // Hard-disable browser native restoration
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }
    }, []);

    const cinematicScroll = useCallback((targetY: number, duration: number = 1600) => {
        const startY = window.scrollY;
        const diff = targetY - startY;
        const startTime = performance.now();

        // Quint easing for a more "gentle" start and soft landing
        const easeOutQuint = (t: number) => 1 + (--t) * t * t * t * t;

        const step = (currentTime: number) => {
            if (userInteracted.current) {
                if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
                return;
            }

            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutQuint(progress);

            window.scrollTo(0, startY + diff * easedProgress);

            if (progress < 1) {
                animationFrameId.current = requestAnimationFrame(step);
            }
        };

        animationFrameId.current = requestAnimationFrame(step);
    }, []);

    const restore = useCallback(() => {
        if (!enabled || hasRestoredKey.current === scrollKey || isActivelyCorrecting.current) return;

        const saved = getSavedScrollPosition(scrollKey);
        if (!saved) return;

        isActivelyCorrecting.current = true;
        setIsRestoring(true);
        userInteracted.current = false;
        restorationStart.current = Date.now();
        lastHeight.current = document.documentElement.scrollHeight;

        requestAnimationFrame(() => {
            cinematicScroll(saved.y, 1600);
        });

        const MONITORING_DURATION = 10000;
        const ANIMATION_BUFFER = 2000;
        let frame = 0;

        const monitorLoop = () => {
            const elapsed = Date.now() - restorationStart.current;

            if (userInteracted.current && elapsed > 400) {
                finalize();
                return;
            }

            if (hasRestoredKey.current === scrollKey && !isActivelyCorrecting.current) return;

            frame++;
            const currentHeight = document.documentElement.scrollHeight;
            const currentY = window.scrollY;

            // Follow the target even if document expands
            if (currentHeight !== lastHeight.current) {
                if (elapsed > 1600) window.scrollTo(0, saved.y);
                lastHeight.current = currentHeight;
            }

            // Persistence lock after animation completes
            if (elapsed > ANIMATION_BUFFER) {
                const isOffTarget = Math.abs(currentY - saved.y) > 3;
                if (isOffTarget || frame % 2 === 0) {
                    window.scrollTo(0, saved.y);
                }
            }

            if (elapsed < MONITORING_DURATION) {
                requestAnimationFrame(monitorLoop);
            } else {
                finalize();
            }
        };

        const finalize = () => {
            hasRestoredKey.current = scrollKey;
            setTimeout(() => {
                isActivelyCorrecting.current = false;
                setIsRestoring(false);
            }, 800);
        };

        requestAnimationFrame(monitorLoop);
    }, [scrollKey, enabled, cinematicScroll]);

    const isReady = useMemo(() => {
        if (dependencies.length === 0) return true;
        return dependencies.every(dep => !dep);
    }, [dependencies]);

    useEffect(() => {
        if (!enabled || !isReady || hasRestoredKey.current === scrollKey) return;

        const timer = setTimeout(() => {
            restore();
        }, 32); // Slightly faster start

        return () => clearTimeout(timer);
    }, [isReady, enabled, scrollKey, restore]);

    useEffect(() => {
        if (!enabled) return;

        let saveDebounce: ReturnType<typeof setTimeout>;
        const interactionEvents = ['wheel', 'touchstart', 'mousedown', 'keydown'];

        const handleInteraction = () => {
            if (isActivelyCorrecting.current && (Date.now() - restorationStart.current > 300)) {
                userInteracted.current = true;
                if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            }
        };

        const handleScroll = () => {
            if (isActivelyCorrecting.current || isRestoring) return;

            clearTimeout(saveDebounce);
            saveDebounce = setTimeout(() => {
                saveScrollPosition(scrollKey);
            }, 250);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        interactionEvents.forEach(evt => window.addEventListener(evt, handleInteraction, { passive: true }));

        return () => {
            window.removeEventListener('scroll', handleScroll);
            interactionEvents.forEach(evt => window.removeEventListener(evt, handleInteraction));
            clearTimeout(saveDebounce);
        };
    }, [scrollKey, enabled, isRestoring]);

    useEffect(() => {
        if (hasRestoredKey.current !== scrollKey) {
            hasRestoredKey.current = null;
            isActivelyCorrecting.current = false;
            setIsRestoring(!!getSavedScrollPosition(scrollKey));
            userInteracted.current = false;
        }
    }, [scrollKey]);

    return { restore, save: () => saveScrollPosition(scrollKey), isRestoring };
};
