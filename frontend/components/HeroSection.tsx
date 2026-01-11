'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Article } from '@/services/article.service';
import { HiOutlineArrowRight, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';
import { getImageUrl } from '@/utils/image';

interface HeroSectionProps {
    featuredArticles: Article[];
}

const HeroSection: React.FC<HeroSectionProps> = ({ featuredArticles }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        if (featuredArticles.length <= 1) return;

        const timer = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % featuredArticles.length);
        }, 6000);

        return () => clearInterval(timer);
    }, [featuredArticles]);

    if (!featuredArticles || featuredArticles.length === 0) return null;

    const currentArticle = featuredArticles[activeIndex];

    const handlePrev = () => {
        setActiveIndex((prev) => (prev - 1 + featuredArticles.length) % featuredArticles.length);
    };

    const handleNext = () => {
        setActiveIndex((prev) => (prev + 1) % featuredArticles.length);
    };

    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    // Minimum swipe distance (in pixels) to trigger action
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            handleNext();
        } else if (isRightSwipe) {
            handlePrev();
        }
    };

    return (
        <section
            className="group relative w-full h-[600px] md:h-[700px] bg-gray-900 overflow-hidden lg:rounded-3xl lg:mt-6 shadow-2xl touch-pan-y"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Background Slideshow */}
            {featuredArticles.map((article, index) => (
                <div
                    key={article.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === activeIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                >
                    <img
                        src={getImageUrl(article.image_url) || '/placeholder-hero.jpg'}
                        alt={article.title}
                        className={`w-full h-full object-cover ${index === activeIndex ? 'scale-105 animate-slow-zoom' : 'scale-100'} transition-transform duration-[6000ms]`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                </div>
            ))}

            {/* Navigation Arrows */}
            {featuredArticles.length > 1 && (
                <>
                    <button
                        onClick={handlePrev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white border border-white/20 hover:bg-white hover:text-black transition-all duration-300 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0"
                    >
                        <HiOutlineChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white border border-white/20 hover:bg-white hover:text-black transition-all duration-300 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
                    >
                        <HiOutlineChevronRight className="w-6 h-6" />
                    </button>
                </>
            )}

            {/* Content Container */}
            <div className="relative h-full container mx-auto px-6 flex flex-col justify-center max-w-4xl">
                <div className="space-y-6">
                    {/* Category Label with slide-up animation */}
                    <div className="overflow-hidden">
                        <span className="inline-block px-4 py-1.5 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest rounded-full animate-slide-up">
                            {currentArticle.category?.name || 'Tiêu điểm'}
                        </span>
                    </div>

                    {/* Title with reveal effect */}
                    <h1 className="text-4xl md:text-6xl font-black text-white leading-tight animate-fade-in-up">
                        {currentArticle.title}
                    </h1>

                    {/* Summary */}
                    <p className="text-lg text-gray-200 line-clamp-2 max-w-2xl animate-fade-in-up [animation-delay:200ms]">
                        {currentArticle.summary || currentArticle.content.substring(0, 200).replace(/<[^>]*>/g, '') + '...'}
                    </p>

                    {/* Author & Button */}
                    <div className="flex flex-wrap items-center gap-6 pt-4 animate-fade-in-up [animation-delay:400ms]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold ring-2 ring-white/20">
                                {currentArticle.author?.full_name?.charAt(0) || 'A'}
                            </div>
                            <div className="text-sm">
                                <p className="text-white font-bold">{currentArticle.author?.full_name}</p>
                                <p className="text-gray-400 text-xs">Biên tập viên</p>
                            </div>
                        </div>

                        <Link
                            href={`/article/${currentArticle.slug}`}
                            className="group px-8 py-4 bg-white text-black font-bold rounded-full flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-xl"
                        >
                            Đọc bài viết ngay
                            <HiOutlineArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                </div>

                {/* Progress Indicators */}
                {featuredArticles.length > 1 && (
                    <div className="absolute bottom-12 left-6 flex gap-3 z-30">
                        {featuredArticles.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveIndex(idx)}
                                className={`h-1 rounded-full transition-all duration-300 ${idx === activeIndex ? 'w-12 bg-blue-600' : 'w-6 bg-white/30 hover:bg-white/50'}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes slow-zoom {
                    from { transform: scale(1); }
                    to { transform: scale(1.1); }
                }
                @keyframes slide-up {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes fade-in-up {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slow-zoom {
                    animation: slow-zoom 20s linear infinite alternate;
                }
                .animate-slide-up {
                    animation: slide-up 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                    opacity: 0;
                }
            `}</style>
        </section>
    );
};

export default HeroSection;
