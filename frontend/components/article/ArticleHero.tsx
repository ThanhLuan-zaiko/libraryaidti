'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HiOutlineClock, HiOutlineChevronLeft, HiOutlineChevronRight, HiArrowLeft } from 'react-icons/hi';
import { Article } from '@/services/article.service';
import { getImageUrl } from '@/utils/image';

interface ArticleHeroProps {
    article: Article;
    formattedDate: string;
    readTime: number;
}

const ArticleHero: React.FC<ArticleHeroProps> = ({ article, formattedDate, readTime }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);
    const router = useRouter();

    // Get all images, fallback to primary image_url if no images array
    const galleryImages = article.images && article.images.length > 0
        ? article.images
        : [{ image_url: article.image_url || '', description: article.title }];

    useEffect(() => {
        setIsZoomed(false);
        const timer = setTimeout(() => setIsZoomed(true), 100);
        return () => clearTimeout(timer);
    }, [activeIndex]);

    useEffect(() => {
        if (galleryImages.length <= 1) return;
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % galleryImages.length);
        }, 8000);
        return () => clearInterval(interval);
    }, [galleryImages.length]);

    const handleBack = (e: React.MouseEvent) => {
        e.preventDefault();
        router.back();
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    };

    const handleNext = (e: React.MouseEvent) => {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % galleryImages.length);
    };

    return (
        <header className="relative w-full min-h-[75vh] lg:min-h-[85vh] py-20 flex items-end bg-gray-950 overflow-hidden">
            {/* Background Slideshow */}
            <div className="absolute inset-0 z-0">
                {galleryImages.map((image, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === activeIndex ? 'opacity-100' : 'opacity-0'
                            }`}
                    >
                        <img
                            src={getImageUrl(image.image_url) || '/placeholder-article.jpg'}
                            className={`w-full h-full object-cover transition-transform duration-[10000ms] ease-out ${index === activeIndex && isZoomed ? 'scale-110' : 'scale-100'
                                }`}
                            alt={image.description || article.title}
                        />
                        <div className="absolute inset-0 bg-gray-950/40" />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent" />
                    </div>
                ))}
            </div>

            {/* Back Button */}
            <div className="absolute top-24 left-6 md:left-12 z-30 pointer-events-auto">
                <button
                    onClick={handleBack}
                    className="group flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-white hover:bg-white hover:text-gray-950 transition-all shadow-2xl overflow-hidden relative"
                >
                    <div className="relative z-10 flex items-center gap-3">
                        <HiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">Quay lại</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/10 to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            </div>

            {/* Navigation Arrows */}
            {galleryImages.length > 1 && (
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 flex justify-between px-6 md:px-12 pointer-events-none">
                    <button
                        onClick={handlePrev}
                        className="w-14 h-14 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-white hover:text-gray-950 transition-all pointer-events-auto shadow-2xl"
                    >
                        <HiOutlineChevronLeft className="w-8 h-8" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="w-14 h-14 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-white hover:text-gray-950 transition-all pointer-events-auto shadow-2xl"
                    >
                        <HiOutlineChevronRight className="w-8 h-8" />
                    </button>
                </div>
            )}

            {/* Content Container */}
            <div className="container mx-auto max-w-7xl px-6 pt-32 pb-20 md:pb-24 relative z-10 pointer-events-none">
                <div className="space-y-8 max-w-5xl">
                    <div className="flex flex-wrap items-center gap-5 pointer-events-auto">
                        <Link
                            href={`/?category_id=${article.category_id}`}
                            className="px-6 py-2.5 bg-blue-600 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-3xl hover:bg-blue-700 transition-all backdrop-blur-md border border-white/20"
                        >
                            {article.category?.name || 'Perspective'}
                        </Link>
                        <div className="flex items-center gap-3 px-5 py-2.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            <span>{readTime} MIN INSIGHT</span>
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-white leading-[0.95] tracking-tighter drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-10 duration-1000 fill-mode-forwards pointer-events-auto">
                        {article.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-12 pointer-events-auto">
                        <div className="flex items-center gap-5 group cursor-pointer lg:pb-2 border-b-2 border-transparent hover:border-blue-600 transition-all">
                            <div className="relative">
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-[2rem] bg-gradient-to-br from-blue-400 to-indigo-800 p-[2px] shadow-3xl group-hover:rotate-6 transition-transform overflow-hidden">
                                    <div className="w-full h-full rounded-[1.9rem] bg-gray-900 flex items-center justify-center text-white text-3xl font-black italic">
                                        {article.author?.full_name?.charAt(0) || 'D'}
                                    </div>
                                </div>
                                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-4 border-gray-950 shadow-lg" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-white font-black text-xl md:text-2xl tracking-tighter leading-none">{article.author?.full_name || 'DTI Specialist'}</p>
                                <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                                    Executive Contributor
                                </p>
                            </div>
                        </div>

                        <div className="hidden lg:block h-16 w-px bg-white/10" />

                        <div className="flex items-center gap-12">
                            <div className="flex flex-col gap-1">
                                <span className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em]">Archived on</span>
                                <span className="text-white font-black text-lg">{formattedDate}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em]">Engagement</span>
                                <span className="text-white font-black text-lg flex items-center gap-3">
                                    <div className="px-2 py-0.5 bg-blue-500/20 rounded text-blue-400 text-xs">HOT</div>
                                    {article.view_count || 0} Readers
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Slideshow Progress Indicators */}
                    {galleryImages.length > 1 && (
                        <div className="flex gap-4 pt-8 pointer-events-auto">
                            {galleryImages.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveIndex(idx)}
                                    className={`h-1.5 rounded-full transition-all duration-500 ${idx === activeIndex ? 'w-16 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'w-8 bg-white/20 hover:bg-white/40'
                                        }`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default ArticleHero;
