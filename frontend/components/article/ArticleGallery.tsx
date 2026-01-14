'use client';

import React, { useRef } from 'react';
import { getImageUrl } from '@/utils/image';
import { Article } from '@/services/article.service';
import { HiOutlinePhotograph, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';

interface ArticleGalleryProps {
    images: Article['images'];
}

const ArticleGallery: React.FC<ArticleGalleryProps> = ({ images }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    if (!images || images.length === 0) return null;

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    return (
        <section className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <HiOutlinePhotograph className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Thư viện hình ảnh</h3>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => scroll('left')}
                        className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    >
                        <HiOutlineChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    >
                        <HiOutlineChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex gap-8 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-4"
            >
                {images.map((image, index) => (
                    <div
                        key={image.id || index}
                        className="flex-shrink-0 w-[85vw] sm:w-[350px] md:w-[600px] snap-start group"
                    >
                        <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem] bg-gray-100 border border-gray-100 shadow-md transition-all duration-500 hover:shadow-xl">
                            <img
                                src={getImageUrl(image.image_url)}
                                alt={image.description || 'Article image'}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            {image.is_primary && (
                                <div className="absolute top-4 left-4 px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">
                                    Highlight
                                </div>
                            )}
                        </div>

                        {image.description && (
                            <div className="mt-4 px-2">
                                <p className="text-gray-500 text-xs font-semibold leading-relaxed italic border-l border-blue-200 pl-3 line-clamp-2 uppercase tracking-wider">
                                    {image.description}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-100 to-transparent pt-8" />
        </section>
    );
};

export default ArticleGallery;
