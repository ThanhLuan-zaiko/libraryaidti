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

function HomeContent() {
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
        console.error('Failed to fetch static homepage data:', error);
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
        // Use a slight delay to ensure the DOM has updated or use scrollIntoView directly
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
        <p className="text-gray-500 font-medium animate-pulse">Đang tải trải nghiệm của bạn...</p>
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
          {/* Header content unchanged... */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-600 font-bold uppercase tracking-[0.2em] text-xs">
              <HiOutlineLightningBolt className="w-4 h-4" />
              <span>Mới nhất hôm nay</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter">
              Khám phá kiến thức <br className="hidden md:block" /> mới mỗi ngày
            </h2>
          </div>
          <Link
            href="/articles"
            className="group flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-blue-600 transition-all duration-300 shadow-lg"
          >
            Xem tất cả bài viết
            <HiOutlineArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
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
          baseUrl="/"
        />
      </section>


      {/* Engagement / Most Discussed */}
      <EngagementShowcase />

      {/* Discovery from Archive */}
      <DiscoveryGrid />

      {/* Topics Discovery */}
      <TopicCloud />

      {/* Community Impact Bar */}
      <ImpactBar />

      {/* More Sections could go here */}
      {latest.length > 9 && (
        <section className="container mx-auto px-4 md:px-6 pb-20">
          <div className="bg-blue-50/50 rounded-[2.5rem] p-8 md:p-12 border border-blue-100/50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-1 space-y-4">
                <h3 className="text-2xl font-black text-gray-900 leading-tight">Có thể bạn <br /> quan tâm</h3>
                <p className="text-sm text-gray-500">Những bài viết được biên tập riêng cho bạn.</p>
                <HiOutlineViewGrid className="w-12 h-12 text-blue-100" />
              </div>
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                {latest.slice(9, 12).map(article => (
                  <ArticleCard key={article.id} article={article} variant="compact" />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer Placeholder (since I don't see a Global Footer) */}
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

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  )
}
