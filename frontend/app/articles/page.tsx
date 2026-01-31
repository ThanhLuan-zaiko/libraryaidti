'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { articleService, Article } from '@/services/article.service';
import HeroSection from '@/components/HeroSection';
import ArticleCard from '@/components/ArticleCard';
import TrendingSection from '@/components/TrendingSection';
import { HiOutlineArrowRight, HiOutlineLightningBolt, HiOutlineViewGrid } from 'react-icons/hi';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import TopicCloud from '@/components/TopicCloud';
import EngagementShowcase from '@/components/EngagementShowcase';
import ImpactBar from '@/components/ImpactBar';
import DiscoveryGrid from '@/components/DiscoveryGrid';
import Pagination from '@/components/Pagination';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';

function ArticlesContent() {
    const searchParams = useSearchParams();
    const urlPage = parseInt(searchParams.get('page') || '1');
    const isInitialMount = React.useRef(true);

    const [featured, setFeatured] = useState<Article[]>([]);
    const [trending, setTrending] = useState<Article[]>([]);
    const [latest, setLatest] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(urlPage);
    const [totalPages, setTotalPages] = useState(1);
    const [latestLoading, setLatestLoading] = useState(false);
    const PAGE_SIZE = 9;

    // Track loading states for scroll restoration
    const { isRestoring } = useScrollRestoration([loading, latestLoading]);

    // Initial load for featured and trending
    useEffect(() => {
        const fetchStaticData = async () => {
            try {
                const [featuredRes, trendingRes] = await Promise.all([
                    articleService.getList({ page: 1, limit: 5, is_featured: true, status: 'PUBLISHED' }),
                    articleService.getTrending(6),
                ]);
                setFeatured(featuredRes.data);
                setTrending(trendingRes.data);
            } catch (error) {
                console.error('Failed to fetch static data:', error);
            }
        };
        fetchStaticData();
    }, []);

    // Sync with URL page changes
    useEffect(() => {
        handlePageChange(urlPage, true);
    }, [urlPage]);

    const handlePageChange = async (page: number, shouldScroll = true) => {
        try {
            setLatestLoading(true);
            setCurrentPage(page);
            const res = await articleService.getList({ page, limit: PAGE_SIZE, status: 'PUBLISHED' });
            setLatest(res.data);
            setTotalPages(Math.ceil(res.meta.total / PAGE_SIZE));

            if (shouldScroll && !isInitialMount.current && !isRestoring) {
                setTimeout(() => {
                    const section = document.getElementById('latest-news');
                    if (section) {
                        section.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 0);
            }
            isInitialMount.current = false;
        } catch (error) {
            console.error('Failed to fetch page:', error);
        } finally {
            setLatestLoading(false);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-6 py-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 font-medium animate-pulse">Đang tải kiến thức...</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#FDFDFD]">
            {/* Hero & Trending Top Section */}
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-8">
                        <HeroSection featuredArticles={featured} />
                    </div>
                    <div className="lg:col-span-4 lg:mt-6">
                        <TrendingSection articles={trending} />
                    </div>
                </div>
            </div>

            {/* Latest News Grid */}
            <section id="latest-news" className="container mx-auto px-4 md:px-6 py-20 relative">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-blue-600 font-bold uppercase tracking-[0.2em] text-xs">
                            <HiOutlineLightningBolt className="w-4 h-4" />
                            <span>Tất cả bài viết</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter">
                            Thư viện kiến thức <br className="hidden md:block" /> đa dạng
                        </h2>
                    </div>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 transition-opacity duration-300 ${latestLoading ? 'opacity-50' : 'opacity-100'}`}>
                    {latest.map((article) => (
                        <ArticleCard key={article.id} article={article} />
                    ))}
                </div>

                {/* Pagination Controls */}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    baseUrl="/articles"
                />
            </section>

            <EngagementShowcase />
            <DiscoveryGrid />
            <TopicCloud />
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

export default function ArticlesPage() {
    return (
        <Suspense>
            <ArticlesContent />
        </Suspense>
    );
}
