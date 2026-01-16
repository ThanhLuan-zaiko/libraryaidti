'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { articleService, Article } from '@/services/article.service';
import { HiOutlineLightningBolt, HiOutlineChevronRight, HiOutlineViewGrid } from 'react-icons/hi';
import { getImageUrl } from '@/utils/image';

const MAX_CATEGORY_ITEMS = 20;

interface CategoryDiscoveryProps {
    initialArticles: Article[];
    categoryId: string;
    currentArticleId: string;
    categoryName?: string;
}

const CategoryDiscovery: React.FC<CategoryDiscoveryProps> = ({
    initialArticles,
    categoryId,
    currentArticleId,
    categoryName
}) => {
    const [articles, setArticles] = useState<Article[]>(initialArticles);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(initialArticles.length === 0);
    const [fetchingMore, setFetchingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [isFallback, setIsFallback] = useState(false);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

    const isLoadingRef = useRef(false);

    const fetchMore = useCallback(async (isInitial = false) => {
        if (!hasMore || articles.length >= MAX_CATEGORY_ITEMS) return;
        if (isLoadingRef.current) return;

        isLoadingRef.current = true;
        if (isInitial) setLoading(true);
        else setFetchingMore(true);

        try {
            let newArticles: Article[] = [];
            let currentIsFallback = isFallback;

            if (!currentIsFallback) {
                const nextPage = isInitial ? 1 : page + 1;
                const res = await articleService.getList({
                    page: nextPage,
                    limit: 6,
                    category_id: categoryId,
                    status: 'PUBLISHED'
                });

                newArticles = res.data.filter((a: Article) =>
                    a.id !== currentArticleId && !articles.some(existing => existing.id === a.id)
                );

                if (newArticles.length === 0 || res.data.length < 6) {
                    if (articles.length + newArticles.length < 3) {
                        const excludeIds = articles.map(a => a.id);
                        const randomRes = await articleService.getRandom(6, excludeIds);
                        const randomArticles = randomRes.data.filter((a: Article) =>
                            a.id !== currentArticleId &&
                            !articles.some(existing => existing.id === a.id) &&
                            !newArticles.some(n => n.id === a.id)
                        );
                        newArticles = [...newArticles, ...randomArticles];
                        setIsFallback(true);
                        currentIsFallback = true;
                    } else {
                        setHasMore(false);
                    }
                }
                setPage(nextPage);
            } else {
                const excludeIds = articles.map(a => a.id);
                const res = await articleService.getRandom(6, excludeIds);
                newArticles = res.data.filter((a: Article) =>
                    a.id !== currentArticleId && !articles.some(existing => existing.id === a.id)
                );

                if (newArticles.length === 0) {
                    setHasMore(false);
                }
            }

            setArticles(prev => {
                const combined = [...prev, ...newArticles];
                const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
                return unique.slice(0, MAX_CATEGORY_ITEMS);
            });

            if (articles.length + newArticles.length < MAX_CATEGORY_ITEMS && newArticles.length > 0) {
                setHasMore(true);
            } else if (newArticles.length === 0) {
                setHasMore(false);
            }

        } catch (error) {
            console.error('Failed to load category discovery content:', error);
            setHasMore(false);
        } finally {
            setLoading(false);
            setFetchingMore(false);
            isLoadingRef.current = false;
        }
    }, [hasMore, articles, page, categoryId, currentArticleId, isFallback]);

    // Initial load if needed
    useEffect(() => {
        if (initialArticles.length === 0) {
            fetchMore(true);
        }
    }, [initialArticles.length, fetchMore]);

    useEffect(() => {
        if (!hasMore || articles.length >= MAX_CATEGORY_ITEMS || loading || fetchingMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    fetchMore();
                }
            },
            { root: scrollContainerRef.current, threshold: 0.1, rootMargin: '0px 200px 0px 0px' }
        );

        if (loadMoreTriggerRef.current) observer.observe(loadMoreTriggerRef.current);
        return () => observer.disconnect();
    }, [fetchMore, hasMore, articles.length, loading, fetchingMore]);

    if (loading && articles.length === 0) {
        return (
            <section className="bg-white border-t border-gray-100 py-24 min-h-[400px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-bold text-blue-600 uppercase tracking-widest">Đang tải nội dung...</p>
                </div>
            </section>
        );
    }

    if (articles.length === 0 && !hasMore) return null;

    return (
        <section className="bg-white border-t border-gray-100 py-24 overflow-hidden relative min-h-[400px]">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-50/30 to-transparent pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-[0.3em] text-[10px]">
                            <HiOutlineLightningBolt className="w-4 h-4" />
                            <span>
                                {isFallback ? 'Gợi ý thêm cho bạn' : `Cùng chuyên mục ${categoryName}`}
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-gray-950 tracking-tighter leading-tight">
                            {isFallback ? 'Có thể bạn' : 'Khám phá'} <span className="text-blue-600 italic">{isFallback ? 'quan tâm' : 'nhiều hơn'}</span>
                        </h2>
                    </div>

                    <div className="hidden md:flex items-center gap-3 text-gray-400 font-bold text-xs uppercase tracking-widest">
                        <span>Scroll right</span>
                        <HiOutlineChevronRight className="w-4 h-4 animate-pulse text-blue-400" />
                    </div>
                </div>

                {/* Horizontal Scroll Layout */}
                <div
                    ref={scrollContainerRef}
                    className="flex gap-8 overflow-x-auto pb-12 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                    {articles.map((article) => (
                        <Link
                            key={article.id}
                            href={`/article/${article.slug}`}
                            className="flex-shrink-0 w-[280px] md:w-[380px] snap-start group relative bg-white rounded-[3rem] border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500"
                        >
                            <div className="aspect-[16/10] overflow-hidden">
                                <img
                                    src={getImageUrl(article.image_url) || '/placeholder-news.jpg'}
                                    alt={article.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                                <span className="inline-block px-3 py-1 bg-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest mb-4">
                                    {article.category?.name}
                                </span>
                                <h3 className="text-lg md:text-xl font-bold leading-tight line-clamp-2 group-hover:text-blue-200 transition-colors">
                                    {article.title}
                                </h3>
                                <div className="mt-4 flex items-center gap-3 text-[10px] font-bold text-white/50 uppercase tracking-widest">
                                    <span>{article.author?.full_name}</span>
                                    <span className="w-1 h-1 rounded-full bg-white/20" />
                                    <span>{new Date(article.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </Link>
                    ))}

                    {/* Infinite Load Trigger */}
                    <div
                        ref={loadMoreTriggerRef}
                        className="flex-shrink-0 w-64 flex flex-col items-center justify-center p-8 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100"
                    >
                        {fetchingMore ? (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Đang tải thêm...</span>
                            </div>
                        ) : articles.length >= MAX_CATEGORY_ITEMS ? (
                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className="w-12 h-12 flex items-center justify-center bg-gray-950 text-white rounded-full shadow-lg">
                                    <HiOutlineViewGrid className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <span className="block text-xs font-black text-gray-950 uppercase tracking-widest">Hết nội dung</span>
                                    <Link href="/" className="text-[10px] font-bold text-blue-600 underline uppercase tracking-widest">Về trang chủ</Link>
                                </div>
                            </div>
                        ) : !hasMore ? (
                            <div className="flex flex-col items-center gap-3 text-center">
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                    {isFallback ? 'Đã xem đủ gợi ý' : 'Đã xem hết chuyên mục'}
                                </span>
                            </div>
                        ) : (
                            <HiOutlineChevronRight className="w-6 h-6 text-blue-300 animate-bounce" />
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CategoryDiscovery;
