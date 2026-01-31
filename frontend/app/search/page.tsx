'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { articleService, Article } from '@/services/article.service';
import HeroSection from '@/components/HeroSection';
import ArticleCard from '@/components/ArticleCard';
import Pagination from '@/components/Pagination';
import TrendingSection from '@/components/TrendingSection';
import TopicCloud from '@/components/TopicCloud';
import EngagementShowcase from '@/components/EngagementShowcase';
import ImpactBar from '@/components/ImpactBar';
import DiscoveryGrid from '@/components/DiscoveryGrid';
import { HiSearch, HiOutlineExclamationCircle, HiOutlineArrowLeft, HiOutlineLightningBolt } from 'react-icons/hi';
import Link from 'next/link';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';

function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get('q') || '';
    const urlPage = parseInt(searchParams.get('page') || '1');

    const [articles, setArticles] = useState<Article[]>([]);
    const [trending, setTrending] = useState<Article[]>([]);
    const [featured, setFeatured] = useState<Article[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [resultsLoading, setResultsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(urlPage);
    const PAGE_SIZE = 12;

    // Track loading states for scroll restoration
    const { isRestoring } = useScrollRestoration([loading, resultsLoading]);

    // Load static data once (Featured & Trending)
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
                console.error('Failed to fetch static search data:', error);
            }
        };
        fetchStaticData();
    }, []);

    // Load search results when query or page changes
    useEffect(() => {
        const fetchResults = async () => {
            if (!query) {
                setLoading(false);
                return;
            }

            setResultsLoading(true);
            try {
                const response = await articleService.search({
                    q: query,
                    page: urlPage,
                    limit: PAGE_SIZE,
                    status: 'PUBLISHED'
                });
                setArticles(response.data);
                setTotal(response.meta.total);
                setCurrentPage(urlPage);
            } catch (error) {
                console.error('Search failed:', error);
                setArticles([]);
                setTotal(0);
            } finally {
                setResultsLoading(false);
                setLoading(false);
            }
        };

        fetchResults();
    }, [query, urlPage]);

    const handlePageChange = (page: number) => {
        router.push(`/search?q=${encodeURIComponent(query)}&page=${page}`);

        // Scroll to results top if not restoring
        if (!isRestoring) {
            setTimeout(() => {
                const section = document.getElementById('search-results');
                if (section) {
                    section.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-6 py-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 font-medium animate-pulse">Đang tìm kiếm kết quả...</p>
            </div>
        );
    }

    if (!query) {
        return (
            <div className="container mx-auto px-6 py-32 text-center bg-white min-h-[70vh] flex flex-col items-center justify-center">
                <div className="p-8 rounded-[3rem] bg-gray-50 border border-gray-100 shadow-sm mb-8">
                    <HiSearch className="w-16 h-16 text-blue-600" />
                </div>
                <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter italic">Bạn đang tìm gì?</h1>
                <p className="text-gray-500 mb-10 max-w-md mx-auto font-medium">
                    Khám phá kho tri thức AIDTI bằng cách nhập từ khóa vào ô tìm kiếm ở trên.
                </p>
                <Link href="/" className="px-8 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-blue-600 transition-all duration-300 shadow-lg flex items-center gap-2">
                    <HiOutlineArrowLeft className="w-5 h-5" /> Quay lại trang chủ
                </Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#FDFDFD]">
            {/* Hero & Trending Top Section (Just like Homepage/Articles page) */}
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

            {/* Results section */}
            <div className="container mx-auto px-4 md:px-6 py-20 border-t border-gray-50">
                <div id="search-results" className="space-y-12">
                    {/* Search Info Header */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-blue-600 font-bold uppercase tracking-[0.2em] text-xs">
                            <HiSearch className="w-4 h-4" />
                            <span>Kết quả tìm kiếm cho:</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter italic">
                            &quot;{query}&quot;
                        </h2>
                        <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold border border-blue-100/50">
                            Tìm thấy {total} bài viết liên quan
                        </div>
                    </div>

                    {/* Results Grid */}
                    {resultsLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 opacity-50 transition-opacity">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="aspect-[16/10] bg-gray-100 rounded-[2.5rem] animate-pulse" />
                            ))}
                        </div>
                    ) : articles.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                                {articles.map((article) => (
                                    <ArticleCard key={article.id} article={article} />
                                ))}
                            </div>

                            {total > PAGE_SIZE && (
                                <div className="pt-12">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={Math.ceil(total / PAGE_SIZE)}
                                        onPageChange={handlePageChange}
                                        baseUrl={`/search?q=${encodeURIComponent(query)}`}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="bg-white rounded-[2.5rem] p-12 text-center border border-gray-100 shadow-sm">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <HiOutlineExclamationCircle className="w-10 h-10 text-gray-300" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Không tìm thấy kết quả</h2>
                            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                                Rất tiếc, chúng tôi không tìm thấy bài viết nào khớp với từ khóa &quot;{query}&quot;.
                                Hãy thử tìm kiếm với cụm từ khác hoặc kiểm tra lại chính tả.
                            </p>
                            <Link href="/" className="inline-flex items-center gap-2 px-8 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-blue-600 transition-all duration-300 shadow-lg">
                                Quay lại Trang chủ
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Engagement & Discovery Sections */}
            <div className="mt-10">
                <EngagementShowcase />
                <DiscoveryGrid />
                <TopicCloud />
                <ImpactBar />
            </div>

            <footer className="bg-white border-t border-gray-100 py-12 px-6">
                <div className="container mx-auto text-center">
                    <div className="text-2xl font-black text-gray-900 tracking-tighter mb-4 italic">
                        Library<span className="text-blue-600">AI</span>DTI
                    </div>
                    <p className="text-sm text-gray-400 font-medium">© 2026 LibraryAI DTI. Trải nghiệm tri thức tương lai.</p>
                </div>
            </footer>
        </main>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="container mx-auto px-6 py-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 font-medium animate-pulse">Đang tải kết quả tìm kiếm...</p>
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}
