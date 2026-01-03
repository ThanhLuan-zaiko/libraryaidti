"use client";

import React from 'react';
import { FiFileText, FiClock, FiEye, FiMessageSquare } from 'react-icons/fi';

interface OverviewStatsProps {
    stats: {
        total_articles: number;
        pending_posts: number;
        article_trend?: number;
        reader_trend?: number;
    };
    analyticsData: {
        total_views: number;
        total_comments: number;
    } | null;
}

const StatCard = ({ title, value, trend, icon, color }: { title: string, value: string | number, trend?: number, icon: React.ReactNode, color: string }) => {
    const colors: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600',
        amber: 'bg-amber-50 text-amber-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
    };

    return (
        <div className="p-5 rounded-2xl bg-white border border-gray-100 hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colors[color]} group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
                {trend !== undefined && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {trend >= 0 ? '+' : ''}{trend}%
                    </span>
                )}
            </div>
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <h4 className="text-2xl font-black text-gray-900">{typeof value === 'number' ? value.toLocaleString('vi-VN') : value}</h4>
                </div>
            </div>
        </div>
    );
};

export default function OverviewStats({ stats, analyticsData }: OverviewStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                title="Tổng bài viết"
                value={stats.total_articles}
                trend={stats.article_trend}
                icon={<FiFileText className="w-5 h-5" />}
                color="blue"
            />
            <StatCard
                title="Chờ duyệt"
                value={stats.pending_posts}
                icon={<FiClock className="w-5 h-5" />}
                color="amber"
            />
            <StatCard
                title="Tổng lượt xem"
                value={analyticsData?.total_views || 0}
                trend={stats.reader_trend}
                icon={<FiEye className="w-5 h-5" />}
                color="green"
            />
            <StatCard
                title="Tổng bình luận"
                value={analyticsData?.total_comments || 0}
                icon={<FiMessageSquare className="w-5 h-5" />}
                color="purple"
            />
        </div>
    );
}
