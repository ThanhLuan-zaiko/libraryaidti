'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { articleService, Article } from '@/services/article.service';
import { categoryService, Category } from '@/services/category.service';
import HeroSection from '@/components/HeroSection';
import ArticleCard from '@/components/ArticleCard';
import TrendingSection from '@/components/TrendingSection';
import { HiOutlineArrowRight, HiOutlineLightningBolt, HiOutlineViewGrid, HiEmojiSad } from 'react-icons/hi';
import Link from 'next/link';
import TopicCloud from '@/components/TopicCloud';
import EngagementShowcase from '@/components/EngagementShowcase';
import ImpactBar from '@/components/ImpactBar';
import DiscoveryGrid from '@/components/DiscoveryGrid';
import Pagination from '@/components/Pagination';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';

function CategoryContent() {
    const { slug } = useParams();
    const searchParams = useSearchParams();
    const urlPage = parseInt(searchParams.get('page') || '1');
    const isInitialMount = React.useRef(true);

    const [category, setCategory] = useState<Category | null>(null);
    const [featured, setFeatured] = useState<Article[]>([]);
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

    // Initial load for category details and featured/trending
    useEffect(() => {
        const fetchCategoryAndInitialData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch category by slug (service uses /categories/:id but handler allows slug)
                const catData = await categoryService.getById(slug as string);
                if (!catData) {
                    setError('Không tìm thấy chuyên mục này');
                    setLoading(false);
                    return;
                }
                setCategory(catData);

                // Parallel fetch for initial page data
                const [featuredRes, trendingRes] = await Promise.all([
                    articleService.getList({
                        page: 1,
                        limit: 5,
                        is_featured: true,
                        status: 'PUBLISHED'
                    }),
                    articleService.getTrending(6),
                ]);

                setFeatured(featuredRes.data);
                setTrending(trendingRes.data);
            } catch (err) {
                console.error('Failed to fetch category data:', err);
                setError('Đã có lỗi xảy ra khi tải dữ liệu chuyên mục');
            } finally {
                // Only stop top-level loading if we have the category
                // handlePageChange will set loading to false after fetching latest articles
            }
        };

        if (slug) fetchCategoryAndInitialData();
    }, [slug]);

    // Sync with URL page changes, dependent on category being loaded
    useEffect(() => {
        if (category) {
            handlePageChange(urlPage, isInitialMount.current);
        }
    }, [urlPage, category]);

    const handlePageChange = async (page: number, isInitial = false) => {
        if (!category) return;

        try {
            setLatestLoading(true);
            setCurrentPage(page);

            const res = await articleService.getList({
                page,
                limit: PAGE_SIZE,
                status: 'PUBLISHED',
                category_id: category.id
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
            console.error('Failed to fetch articles page:', err);
        } finally {
            setLatestLoading(false);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-6 py-40 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 font-medium animate-pulse">Đang tải kiến thức cho bạn...</p>
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
                <Link href="/" className="px-8 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-blue-600 transition-all">
                    Quay lại trang chủ
                </Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#FDFDFD]">
            {/* Category Hero & Trending */}
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

            {/* Category Specific News Grid */}
            <section id="latest-news" className="container mx-auto px-4 md:px-6 py-20 relative">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-blue-600 font-bold uppercase tracking-[0.2em] text-xs">
                            <HiOutlineLightningBolt className="w-4 h-4" />
                            <span>Chuyên mục {category?.name}</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter">
                            Kiến thức mới nhất về <br className="hidden md:block" /> {category?.name}
                        </h2>
                    </div>
                </div>

                {latest.length > 0 ? (
                    <>
                        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 transition-opacity duration-300 ${latestLoading ? 'opacity-50' : 'opacity-100'}`}>
                            {latest.map((article) => (
                                <ArticleCard key={article.id} article={article} />
                            ))}
                        </div>

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            baseUrl={`/category/${slug}`}
                        />
                    </>
                ) : (
                    <div className="py-20 text-center bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                        <p className="text-gray-400 font-bold italic">Chưa có bài viết nào trong chuyên mục này.</p>
                    </div>
                )}
            </section>

            {/* Global Discover Elements */}
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

export default function CategoryPage() {
    return (
        <Suspense>
            <CategoryContent />
        </Suspense>
    )
}
