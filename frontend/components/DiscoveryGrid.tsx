'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { articleService, Article } from '@/services/article.service';
import { HiOutlineRefresh, HiOutlineLightningBolt, HiOutlineChevronRight, HiOutlineViewGrid } from 'react-icons/hi';
import { getImageUrl } from '@/utils/image';

const MAX_DISCOVERY_ITEMS = 30;

const DiscoveryGrid: React.FC = () => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchingMore, setFetchingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

    const fetchRandom = useCallback(async (append = false) => {
        if (append) {
            if (fetchingMore || !hasMore || articles.length >= MAX_DISCOVERY_ITEMS) return;
            setFetchingMore(true);
        } else {
            if (refreshing) return;
            setRefreshing(true);
            setHasMore(true); // Reset when refreshing
        }

        try {
            const res = await articleService.getRandom(6);
            if (append) {
                setArticles(prev => {
                    const existingIds = new Set(prev.map(a => a.id));
                    const newArticles = res.data.filter((a: Article) => !existingIds.has(a.id));

                    if (newArticles.length === 0 || (prev.length + newArticles.length) >= MAX_DISCOVERY_ITEMS) {
                        setHasMore(false);
                    }

                    const combined = [...prev, ...newArticles];
                    return combined.slice(0, MAX_DISCOVERY_ITEMS);
                });
            } else {
                setArticles(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch random articles:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setFetchingMore(false);
        }
    }, [fetchingMore, refreshing, hasMore, articles.length]);

    useEffect(() => {
        fetchRandom();
    }, []); // Initial fetch only

    useEffect(() => {
        if (!hasMore || articles.length >= MAX_DISCOVERY_ITEMS) return;

        const option = {
            root: scrollContainerRef.current,
            rootMargin: '0px 200px 0px 0px',
            threshold: 0.1
        };

        const handleObserver = (entries: IntersectionObserverEntry[]) => {
            const target = entries[0];
            if (target.isIntersecting && !fetchingMore && !refreshing) {
                fetchRandom(true);
            }
        };

        const observer = new IntersectionObserver(handleObserver, option);
        if (loadMoreTriggerRef.current) {
            observer.observe(loadMoreTriggerRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [fetchRandom, fetchingMore, refreshing, hasMore, articles.length]);

    if (loading && articles.length === 0) return null;

    return (
        <section className="container mx-auto px-4 md:px-6 py-24 overflow-hidden border-t border-gray-50">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-amber-500 font-bold uppercase tracking-[0.2em] text-xs">
                        <HiOutlineLightningBolt className="w-4 h-4" />
                        <span>Kho lưu trữ ngẫu nhiên</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter">
                        Khám phá <span className="text-amber-500 italic">vô tận</span>
                    </h2>
                    <p className="text-gray-500 max-w-lg font-medium">
                        Điểm lại những giá trị tri thức bất ngờ. Cuộn ngang để xem thêm nội dung thú vị.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => fetchRandom(false)}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-100 text-gray-900 rounded-2xl font-bold hover:bg-gray-50 hover:border-amber-200 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                    >
                        <HiOutlineRefresh className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                        Làm mới
                    </button>
                    <div className="hidden md:flex items-center gap-2 text-gray-400 font-bold text-sm">
                        <span>Cuộn ngang</span>
                        <HiOutlineChevronRight className="w-4 h-4 animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Horizontal Scroll Container */}
            <div
                ref={scrollContainerRef}
                className="flex gap-8 overflow-x-auto pb-12 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
                {articles.map((article) => (
                    <Link
                        key={article.id}
                        href={`/article/${article.slug}`}
                        className="flex-shrink-0 w-[280px] md:w-[350px] snap-start group relative bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500"
                    >
                        <div className="aspect-[4/5] overflow-hidden">
                            <img
                                src={getImageUrl(article.image_url) || '/placeholder-news.jpg'}
                                alt={article.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-70 group-hover:opacity-85 transition-opacity" />
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                            <span className="inline-block px-3 py-1 bg-amber-500 rounded-lg text-[10px] font-black uppercase tracking-widest mb-4">
                                {article.category?.name}
                            </span>
                            <h3 className="text-lg md:text-xl font-bold leading-tight line-clamp-3 group-hover:text-amber-200 transition-colors">
                                {article.title}
                            </h3>
                            <div className="mt-4 flex items-center gap-3 text-xs font-bold text-white/60">
                                <span>{article.author?.full_name}</span>
                                <span className="w-1 h-1 rounded-full bg-white/30" />
                                <span>{new Date(article.created_at).getFullYear()}</span>
                            </div>
                        </div>
                    </Link>
                ))}

                {/* Loading / End Trigger Element */}
                <div
                    ref={loadMoreTriggerRef}
                    className="flex-shrink-0 w-64 flex flex-col items-center justify-center p-8 bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-100"
                >
                    {fetchingMore ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Đang tải...</span>
                        </div>
                    ) : articles.length >= MAX_DISCOVERY_ITEMS ? (
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="w-12 h-12 flex items-center justify-center bg-gray-900 text-white rounded-full shadow-lg">
                                <HiOutlineViewGrid className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <span className="block text-xs font-black text-gray-900 uppercase tracking-widest">
                                    Đã tới giới hạn
                                </span>
                                <Link
                                    href="/articles"
                                    className="text-[10px] font-bold text-amber-600 hover:text-amber-700 underline underline-offset-4 uppercase tracking-widest"
                                >
                                    Xem tất cả bài viết
                                </Link>
                            </div>
                        </div>
                    ) : !hasMore ? (
                        <div className="flex flex-col items-center gap-3 text-center">
                            <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full">
                                <HiOutlineLightningBolt className="w-5 h-5 text-gray-400" />
                            </div>
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest leading-tight">
                                Bạn đã xem hết <br /> kho lưu trữ
                            </span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 opacity-30">
                            <HiOutlineChevronRight className="w-6 h-6 animate-bounce" />
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default DiscoveryGrid;
