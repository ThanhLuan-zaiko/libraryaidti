'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { categoryService, CategoryStats } from '@/services/category.service';
import { tagService, TagStats } from '@/services/tag.service';
import { HiOutlineTag, HiOutlineCollection } from 'react-icons/hi';

const TopicCloud: React.FC = () => {
    const [categories, setCategories] = useState<CategoryStats[]>([]);
    const [tags, setTags] = useState<TagStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTopics = async () => {
            try {
                const [catStats, tagStats] = await Promise.all([
                    categoryService.getStats(),
                    tagService.getStats()
                ]);
                setCategories(catStats.slice(0, 8)); // Top 8 categories
                setTags(tagStats.slice(0, 15));      // Top 15 tags
            } catch (error) {
                console.error('Failed to fetch topics:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTopics();
    }, []);

    if (loading || (categories.length === 0 && tags.length === 0)) return null;

    return (
        <section className="container mx-auto px-4 md:px-6 py-12">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-sm overflow-hidden relative">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -ml-32 -mb-32" />

                <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Categories Column */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/20">
                                <HiOutlineCollection className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Chuyên mục phổ biến</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {categories.map((cat) => (
                                <Link
                                    key={cat.id}
                                    href={`/category/${cat.id}`}
                                    className="group p-5 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-blue-50/50 transition-all duration-300"
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-gray-700 group-hover:text-blue-600 transition-colors">{cat.name}</span>
                                        <span className="px-2.5 py-1 bg-white border border-gray-100 rounded-lg text-xs font-black text-gray-400 group-hover:text-blue-500 group-hover:border-blue-100 transition-all">
                                            {cat.article_count}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Tags Column */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/20">
                                <HiOutlineTag className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Thẻ xu hướng</h3>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {tags.map((tag) => (
                                <Link
                                    key={tag.id}
                                    href={`/tag/${tag.slug}`}
                                    className="px-5 py-3 bg-gray-50 text-gray-600 font-bold rounded-2xl border border-gray-100 hover:border-indigo-600 hover:bg-indigo-600 hover:text-white transition-all duration-300 text-sm"
                                >
                                    #{tag.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TopicCloud;
