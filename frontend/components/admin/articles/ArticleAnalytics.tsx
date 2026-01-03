"use client";

import React, { useEffect, useState } from 'react';
import {
    FiTrendingUp,
    FiChevronDown,
    FiChevronUp,
} from 'react-icons/fi';
import { getDashboardData, dashboardService, DashboardData, AdvancedAnalyticsData } from '@/services/dashboard.service';
import { articleService, Article } from '@/services/article.service';

import OverviewStats from './analytics/OverviewStats';
import EngagementTrends from './analytics/EngagementTrends';
import RankingDashboard from './analytics/RankingDashboard';
import ContentLists from './analytics/ContentLists';
import CategoryPerformance from './analytics/CategoryPerformance';
import ArticlePerformanceTable from './analytics/ArticlePerformanceTable';

const ArticleAnalytics = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [advancedData, setAdvancedData] = useState<AdvancedAnalyticsData | null>(null);
    const [topArticles, setTopArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dashRes, analyticsRes, articlesRes, advRes] = await Promise.all([
                    getDashboardData(),
                    dashboardService.getAnalytics(),
                    articleService.getList({ page: 1, limit: 5, status: 'PUBLISHED' }),
                    dashboardService.getAdvancedAnalytics()
                ]);
                setData(dashRes);
                setAnalyticsData(analyticsRes);
                setTopArticles(articlesRes.data);
                setAdvancedData(advRes);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading || !data) return (
        <div className="w-full h-48 flex items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse">
            <div className="flex flex-col items-center gap-3">
                <FiTrendingUp className="w-8 h-8 text-gray-200" />
                <div className="h-4 w-32 bg-gray-100 rounded-lg"></div>
            </div>
        </div>
    );

    const { stats, analytics } = data;

    const statusData = [
        { name: 'Đã xuất bản', value: stats.total_articles - stats.pending_posts, color: '#10b981' },
        { name: 'Chờ duyệt', value: stats.pending_posts, color: '#f59e0b' },
        { name: 'Bản nháp', value: Math.max(0, stats.total_articles * 0.1), color: '#64748b' },
    ];

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8 transition-all duration-300">
            {/* Header */}
            <div
                className="px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 bg-gradient-to-r from-blue-50/50 to-transparent transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
                        <FiTrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Trung tâm Phân tích & Hiệu suất</h2>
                        <p className="text-xs text-gray-500 font-medium">Theo dõi dữ liệu nội dung thời gian thực</p>
                    </div>
                </div>
                <button className="p-2 hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-200 shadow-sm">
                    {isExpanded ? <FiChevronUp className="text-gray-400" /> : <FiChevronDown className="text-gray-400" />}
                </button>
            </div>

            <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="p-6 space-y-10">
                    <OverviewStats stats={stats} analyticsData={analyticsData} />

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        <EngagementTrends analytics={analytics} />
                        <CategoryPerformance categories={analyticsData?.top_categories || []} />
                    </div>

                    <RankingDashboard
                        statusData={statusData}
                        analyticsData={analyticsData}
                        stats={stats}
                    />

                    <ArticlePerformanceTable articles={topArticles} />

                    <ContentLists
                        topArticles={topArticles}
                        activities={data.activities}
                        topTags={analyticsData?.top_tags || []}
                        advancedData={advancedData}
                    />
                </div>
            </div>
        </div>
    );
};

export default ArticleAnalytics;
