'use client';

import React from 'react';
import Link from 'next/link';
import { Article } from '@/services/article.service';
import { HiOutlineClock, HiOutlineChevronRight } from 'react-icons/hi';
import { getImageUrl } from '@/utils/image';

interface ArticleCardProps {
    article: Article;
    variant?: 'default' | 'compact' | 'large';
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, variant = 'default' }) => {
    const formattedDate = new Date(article.published_at || article.created_at).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    // Estimate reading time (roughly 200 words per minute)
    const readTime = Math.max(1, Math.ceil(article.content.split(/\s+/).length / 200));

    if (variant === 'compact') {
        return (
            <Link href={`/article/${article.slug}`} className="group block">
                <div className="flex gap-4 items-center">
                    <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden shadow-sm">
                        <img
                            src={getImageUrl(article.image_url) || '/placeholder-news.jpg'}
                            alt={article.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    </div>
                    <div className="flex-grow min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                            {article.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                            <span>{formattedDate}</span>
                            <span className="flex items-center gap-1">
                                <HiOutlineClock className="w-3 h-3" />
                                {readTime} phút đọc
                            </span>
                        </div>
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <div className="group relative bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
            {/* Image Container */}
            <Link href={`/article/${article.slug}`} className="relative block aspect-[16/10] overflow-hidden">
                <img
                    src={getImageUrl(article.image_url) || '/placeholder-news.jpg'}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Category Badge */}
                {article.category && (
                    <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
                            {article.category.name}
                        </span>
                    </div>
                )}
            </Link>

            {/* Content */}
            <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
                        <HiOutlineClock className="w-3.5 h-3.5" />
                        <span>{formattedDate}</span>
                    </div>
                    <span className="w-1 h-1 rounded-full bg-gray-200" />
                    <span className="text-[11px] font-medium text-gray-400">{readTime} phút đọc</span>
                </div>

                <Link href={`/article/${article.slug}`}>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                        {article.title}
                    </h3>
                </Link>

                <p className="text-sm text-gray-500 line-clamp-3 mb-6 leading-relaxed">
                    {article.summary || article.content.substring(0, 150).replace(/<[^>]*>/g, '') + '...'}
                </p>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {article.author?.full_name && (
                            <span className="text-xs font-semibold text-gray-600">
                                {article.author.full_name}
                            </span>
                        )}
                    </div>

                    <Link
                        href={`/article/${article.slug}`}
                        className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider"
                    >
                        Đọc thêm
                        <HiOutlineChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ArticleCard;
