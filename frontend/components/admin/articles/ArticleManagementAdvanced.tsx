"use client";

import React, { useState, useEffect } from 'react';
import {
    FiCpu,
    FiDownload,
    FiRefreshCw
} from 'react-icons/fi';
import { dashboardService, AdvancedAnalyticsData, AnalyticsData } from '@/services/dashboard.service';
import SEOAudit from './advanced/SEOAudit';
import WorkflowBottlenecks from './advanced/WorkflowBottlenecks';
import KeywordInsights from './advanced/KeywordInsights';
import TechnicalOverview from './advanced/TechnicalOverview';
import ContentRelationStats from './advanced/ContentRelationStats';

import { downloadCSV } from '@/utils/export';

const ArticleManagementAdvanced = () => {
    const [advancedData, setAdvancedData] = useState<AdvancedAnalyticsData | null>(null);
    const [basicAnalytics, setBasicAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [advRes, basicRes] = await Promise.all([
                dashboardService.getAdvancedAnalytics(),
                dashboardService.getAnalytics()
            ]);
            setAdvancedData(advRes);
            setBasicAnalytics(basicRes);
        } catch (error) {
            console.error("Failed to fetch advanced analytics", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!advancedData) return;

        // Prepare data for SEO report
        const seoData = [
            { Metric: 'Total SEO Records', Value: advancedData.seo_stats.total_seo_records },
            { Metric: 'Missing Meta Description', Value: advancedData.seo_stats.missing_meta_description },
            { Metric: 'Missing OG Image', Value: advancedData.seo_stats.missing_og_image },
        ];

        // Prepare data for Workflow report
        const workflowData = advancedData.workflow_stats.map(s => ({
            Status: s.status,
            'Average Days': s.avg_days.toFixed(2)
        }));

        // Combine or export separately - let's do a simple combined summary for now
        const summaryData = [
            ...seoData,
            { Metric: '---', Value: '---' },
            { Metric: 'WORKFLOW STATS', Value: '' },
            ...workflowData.map(w => ({ Metric: w.Status, Value: w['Average Days'] })),
            { Metric: '---', Value: '---' },
            { Metric: 'CONTENT GRAPH', Value: '' },
            { Metric: 'Total Relations', Value: advancedData.content_graph.total_relations },
            { Metric: 'Orphan Pages', Value: advancedData.content_graph.orphan_pages },
            { Metric: 'Avg Links Per Article', Value: advancedData.content_graph.avg_links_per_article.toFixed(2) }
        ];

        downloadCSV(summaryData, `Article_Advanced_Report_${new Date().toISOString().split('T')[0]}`);
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading || !advancedData) return (
        <div className="w-full h-64 flex items-center justify-center animate-pulse bg-gray-50 rounded-3xl border border-gray-100">
            <div className="flex flex-col items-center gap-4">
                <FiCpu className="w-10 h-10 text-gray-200 animate-spin" />
                <div className="h-4 w-48 bg-gray-200 rounded-full"></div>
            </div>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h2 className="text-xl font-black text-gray-900">Trung tâm Báo cáo Chuyên sâu</h2>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">Dữ liệu phân tích kỹ thuật & SEO thời gian thực</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchData}
                        className="p-3 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
                        title="Làm mới dữ liệu"
                    >
                        <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
                    >
                        <FiDownload />
                        Xuất Báo cáo (CSV)
                    </button>
                </div>
            </div>

            {/* Matrix 1: SEO & Workflow */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <SEOAudit stats={advancedData.seo_stats} />
                <WorkflowBottlenecks stats={advancedData.workflow_stats} />
            </div>

            {/* Matrix 2: Relations & Keywords */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2">
                    <ContentRelationStats stats={advancedData.content_graph} />
                </div>
                <KeywordInsights tags={basicAnalytics?.top_tags || []} />
            </div>

            {/* Matrix 3: Technical Overview */}
            <TechnicalOverview
                mediaStats={advancedData.media_stats}
                versioningStats={advancedData.versioning_stats}
            />

            {/* AI Advisor / Insight Footer */}
            <div className="p-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl text-white shadow-xl shadow-blue-100 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-20 h-20 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
                        <FiCpu className="w-10 h-10" />
                    </div>
                    <div>
                        <h4 className="text-xl font-bold mb-2">Lời khuyên từ Hệ thống AI Phân tích</h4>
                        <p className="text-blue-100 leading-relaxed max-w-3xl">
                            Dựa trên dữ liệu hiện tại, tỷ lệ trang mồ côi ({advancedData.content_graph.orphan_pages}) đang có xu hướng tăng.
                            Chúng tôi khuyến nghị bạn nên rà soát lại các bài viết mới và bổ sung ít nhất 2-3 liên kết nội bộ hướng tới các bài viết cũ
                            trong cùng danh mục để tối ưu hóa dòng chảy authority.
                        </p>
                    </div>
                </div>
                <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            </div>
        </div>
    );
};

export default ArticleManagementAdvanced;
