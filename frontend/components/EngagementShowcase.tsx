'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { articleService, Article } from '@/services/article.service';
import { HiOutlineChatAlt2, HiOutlineAnnotation, HiOutlineTrendingUp, HiOutlineEye } from 'react-icons/hi';
import { getImageUrl } from '@/utils/image';

const EngagementShowcase: React.FC = () => {
    const [discussed, setDiscussed] = useState<Article[]>([]);
    const [trending, setTrending] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [discussedRes, trendingRes] = await Promise.all([
                    articleService.getDiscussed(5),
                    articleService.getTrending(5)
                ]);
                setDiscussed(discussedRes.data);
                setTrending(trendingRes.data);
            } catch (error) {
                console.error('Failed to fetch engagement data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading || (discussed.length === 0 && trending.length === 0)) return null;

    const RankingList = ({ title, icon: Icon, articles, metricIcon: MetricIcon, metricKey }: {
        title: string,
        icon: any,
        articles: Article[],
        metricIcon: any,
        metricKey: 'comment_count' | 'view_count'
    }) => (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gray-900 rounded-xl text-white shadow-lg">
                    <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">{title}</h3>
            </div>
            <div className="space-y-4">
                {articles.map((article, idx) => (
                    <Link
                        key={article.id}
                        href={`/article/${article.slug}`}
                        className="group flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all duration-300"
                    >
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-400 font-black text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            {idx + 1}
                        </div>
                        <div className="flex-grow min-w-0">
                            <h4 className="font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                                {article.title}
                            </h4>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                                    {article.category?.name}
                                </span>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                                    <MetricIcon className="w-3 h-3" />
                                    {article[metricKey] || 0}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );

    return (
        <section className="container mx-auto px-4 md:px-6 py-12">
            <div className="flex flex-col lg:flex-row gap-12">
                {/* Left: Featured Engagement (Large Cards) */}
                <div className="lg:w-2/3 space-y-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase tracking-widest text-xs">
                            <HiOutlineChatAlt2 className="w-4 h-4" />
                            <span>Thảo luận sôi nổi</span>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter">
                            Cộng đồng đang <span className="text-indigo-600">tương tác</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {discussed.slice(0, 4).map((article) => (
                            <Link
                                key={article.id}
                                href={`/article/${article.slug}`}
                                className="group flex flex-col gap-4 p-5 bg-white rounded-[2rem] border border-gray-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-900/5 transition-all duration-300"
                            >
                                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden">
                                    <img
                                        src={getImageUrl(article.image_url) || '/placeholder-news.jpg'}
                                        alt={article.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute top-3 right-3 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl text-white text-xs font-black flex items-center gap-1.5 border border-white/20">
                                        <HiOutlineAnnotation className="w-4 h-4" />
                                        {article.comment_count || 0}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-black text-gray-900 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                                        {article.title}
                                    </h3>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                        <span>{article.author?.full_name}</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                                        <span>{new Date(article.created_at).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Right: Ranking Leaderboards */}
                <div className="lg:w-1/3 space-y-12">
                    <RankingList
                        title="Xem nhiều nhất"
                        icon={HiOutlineTrendingUp}
                        articles={trending}
                        metricIcon={HiOutlineEye}
                        metricKey="view_count"
                    />
                    <div className="h-px bg-gray-100 w-full" />
                    <RankingList
                        title="Bình luận nhiều nhất"
                        icon={HiOutlineAnnotation}
                        articles={discussed}
                        metricIcon={HiOutlineChatAlt2}
                        metricKey="comment_count"
                    />
                </div>
            </div>
        </section>
    );
};

export default EngagementShowcase;
