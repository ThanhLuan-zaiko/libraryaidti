'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { articleService, Article } from '@/services/article.service';
import { tagService, Tag, TagStats } from '@/services/tag.service';
import ArticleCard from '@/components/ArticleCard';
import TrendingSection from '@/components/TrendingSection';
import { HiOutlineLightningBolt, HiEmojiSad } from 'react-icons/hi';
import Link from 'next/link';
import TopicCloud from '@/components/TopicCloud';
import EngagementShowcase from '@/components/EngagementShowcase';
import ImpactBar from '@/components/ImpactBar';
import DiscoveryGrid from '@/components/DiscoveryGrid';
import Pagination from '@/components/Pagination';
import TagHero from '@/components/tag/TagHero';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';

function TagContent() {
    const { slug } = useParams();
    const searchParams = useSearchParams();
    const urlPage = parseInt(searchParams.get('page') || '1');
    const isInitialMount = React.useRef(true);

    const [tag, setTag] = useState<Tag | null>(null);
    const [tagStats, setTagStats] = useState<TagStats | null>(null);
    const [trending, setTrending] = useState<Article[]>([]);
    const [latest, setLatest] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(urlPage);
    const [totalPages, setTotalPages] = useState(1);
    const [latestLoading, setLatestLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const PAGE_SIZE = 9;

    // Track loading states for scroll restoration
    const { isRestoring } = useScrollRestoration([loading, latestLoading]);

    // Initial load for tag details and trending
    useEffect(() => {
        const fetchTagAndInitialData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch tag by slug
                const tagData = await tagService.getById(slug as string);
                if (!tagData) {
                    setError('Không tìm thấy chủ đề này');
                    setLoading(false);
                    return;
                }
                setTag(tagData);

                // Fetch stats to get usage count (optional but nice)
                try {
                    const statsRes = await tagService.getStats(100);
                    const currentStats = statsRes.find(s => s.id === tagData.id);
                    if (currentStats) setTagStats(currentStats);
                } catch (e) {
                    console.warn('Failed to fetch tag stats:', e);
                }

                // Parallel fetch for initial page data
                const trendingRes = await articleService.getTrending(6);
                setTrending(trendingRes.data);
            } catch (err) {
                console.error('Failed to fetch tag data:', err);
                setError('Đã có lỗi xảy ra khi tải dữ liệu chủ đề');
                setLoading(false);
            }
        };

        if (slug) fetchTagAndInitialData();
    }, [slug]);

    // Sync with URL page changes, dependent on tag being loaded
    useEffect(() => {
        if (tag) {
            handlePageChange(urlPage, isInitialMount.current);
        }
    }, [urlPage, tag]);

    const handlePageChange = async (page: number, isInitial = false) => {
        if (!tag) return;

        try {
            setLatestLoading(true);
            setCurrentPage(page);

            const res = await articleService.getList({
                page,
                limit: PAGE_SIZE,
                status: 'PUBLISHED',
                tag_id: tag.id
            });

            setLatest(res.data);
            setTotalPages(Math.ceil(res.meta.total / PAGE_SIZE));

            if (!isInitial && !isRestoring) {
                setTimeout(() => {
                    const section = document.getElementById('latest-news');
                    if (section) {
                        section.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 0);
            }
            isInitialMount.current = false;
        } catch (err) {
            console.error('Failed to fetch filtered articles:', err);
        } finally {
            setLatestLoading(false);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-6 py-40 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 font-medium animate-pulse">Đang chuẩn bị dữ liệu cho bạn...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-6 py-40 flex flex-col items-center justify-center text-center space-y-6">
                <div className="text-gray-200">
                    <HiEmojiSad className="w-24 h-24" />
                </div>
                <h2 className="text-3xl font-black text-gray-900">{error}</h2>
                <Link href="/" className="px-8 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all">
                    Quay lại khám phá
                </Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#FDFDFD]">
            {/* Unique Tag Hero */}
            <div className="container mx-auto px-4 md:px-6">
                <TagHero tagName={tag?.name || ''} usageCount={tagStats?.usage_count || latest.length} />
            </div>

            <div className="container mx-auto px-4 md:px-6 -mt-12 mb-20">
                <div className="bg-white rounded-[3rem] shadow-xl shadow-gray-200/50 p-8 md:p-12 border border-gray-100 relative z-20">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        <div className="lg:col-span-8">
                            {/* Latest News Grid */}
                            <section id="latest-news" className="relative">
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-blue-600 font-bold uppercase tracking-[0.2em] text-xs">
                                            <HiOutlineLightningBolt className="w-4 h-4" />
                                            <span>Xu hướng {tag?.name}</span>
                                        </div>
                                        <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter">
                                            Bài viết mới nhất
                                        </h2>
                                    </div>
                                </div>

                                {latest.length > 0 ? (
                                    <>
                                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 transition-opacity duration-300 ${latestLoading ? 'opacity-50' : 'opacity-100'}`}>
                                            {latest.map((article) => (
                                                <ArticleCard key={article.id} article={article} />
                                            ))}
                                        </div>

                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            onPageChange={handlePageChange}
                                            baseUrl={`/tag/${slug}`}
                                        />
                                    </>
                                ) : (
                                    <div className="py-20 text-center bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                                        <p className="text-gray-400 font-bold italic">Chưa có bài viết nào với thẻ này.</p>
                                    </div>
                                )}
                            </section>
                        </div>

                        <div className="lg:col-span-4">
                            <TrendingSection articles={trending} title="Có thể bạn quan tâm" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Global Discover Elements */}
            <TopicCloud />
            <EngagementShowcase />
            <DiscoveryGrid />
            <ImpactBar />

            <footer className="bg-white border-t border-gray-100 py-12 px-6">
                <div className="container mx-auto text-center">
                    <div className="text-2xl font-black text-gray-900 tracking-tighter mb-4">
                        Library<span className="text-blue-600">AI</span>DTI
                    </div>
                    <p className="text-sm text-gray-400">© 2026 LibraryAI DTI. Tất cả quyền được bảo lưu.</p>
                </div>
            </footer>
        </main>
    );
}

export default function TagPage() {
    return (
        <Suspense>
            <TagContent />
        </Suspense>
    )
}
