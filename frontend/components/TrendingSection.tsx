'use client';

import React from 'react';
import Link from 'next/link';
import { Article } from '@/services/article.service';
import { HiOutlineTrendingUp, HiOutlineChevronRight } from 'react-icons/hi';

interface TrendingSectionProps {
    articles: Article[];
}

const TrendingSection: React.FC<TrendingSectionProps> = ({ articles }) => {
    if (!articles || articles.length === 0) return null;

    return (
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm h-full">
            <div className="flex items-center gap-2 mb-8">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <HiOutlineTrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                    Thịnh hành
                </h3>
            </div>

            <div className="space-y-6">
                {articles.map((article, index) => (
                    <Link
                        key={article.id}
                        href={`/article/${article.slug}`}
                        className="group flex gap-6 items-start"
                    >
                        <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 group-hover:bg-blue-600 transition-colors duration-300">
                            <span className="text-lg font-black text-gray-400 group-hover:text-white transition-colors duration-300 italic">
                                0{index + 1}
                            </span>
                        </div>
                        <div className="flex-grow space-y-2">
                            {article.category && (
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                                    {article.category.name}
                                </span>
                            )}
                            <h4 className="text-md font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors duration-300">
                                {article.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-gray-400">
                                <span>{article.author?.full_name}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-200" />
                                <span>{new Date(article.published_at || article.created_at).toLocaleDateString('vi-VN')}</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <button className="mt-8 w-full py-4 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 text-sm font-bold hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50/50 transition-all group">
                <span className="flex items-center justify-center gap-2">
                    Xem tất cả xu hướng
                    <HiOutlineChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
            </button>
        </div>
    );
};

export default TrendingSection;
