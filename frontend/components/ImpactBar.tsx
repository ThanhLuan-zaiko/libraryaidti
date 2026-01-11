'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/services/api';
import { HiOutlineDocumentText, HiOutlineUserGroup, HiOutlineViewGrid } from 'react-icons/hi';

interface PublicStats {
    total_articles: number;
    total_readers: number;
    total_categories: number;
}

const ImpactBar: React.FC = () => {
    const [stats, setStats] = useState<PublicStats | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await apiClient.get<PublicStats>('/stats/public');
                setStats(res.data);
            } catch (error) {
                console.error('Failed to fetch public stats:', error);
            }
        };
        fetchStats();
    }, []);

    if (!stats) return null;

    const items = [
        { label: 'Bài viết hữu ích', value: stats.total_articles, icon: HiOutlineDocumentText, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Độc giả đăng ký', value: stats.total_readers, icon: HiOutlineUserGroup, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Chuyên mục đa dạng', value: stats.total_categories, icon: HiOutlineViewGrid, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    ];

    return (
        <section className="container mx-auto px-4 md:px-6 py-8">
            <div className="bg-white rounded-[2rem] p-6 md:p-10 border border-gray-100 shadow-sm flex flex-wrap justify-around items-center gap-8">
                {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-5">
                        <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center shadow-lg shadow-gray-200/50 transition-transform hover:scale-110`}>
                            <item.icon className="w-7 h-7" />
                        </div>
                        <div className="space-y-0.5">
                            <div className="text-3xl font-black text-gray-900 tracking-tight">
                                {item.value}+
                            </div>
                            <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                {item.label}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default ImpactBar;
