"use client";

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { FiStar } from 'react-icons/fi';

interface RankingDashboardProps {
    statusData: any[];
    analyticsData: any;
    stats: any;
}

export default function RankingDashboard({ statusData, analyticsData, stats }: RankingDashboardProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Status Distribution */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-6">Trạng thái nội dung</h3>
                <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusData}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                    {statusData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                <span className="text-gray-600">{item.name}</span>
                            </div>
                            <span className="font-bold text-gray-900">{Math.round(item.value)}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Engagement Details */}
            <div className="lg:col-span-2 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <FiStar className="text-amber-400 fill-current" />
                        Điểm tin nổi bật
                    </h3>
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">TB Lượt xem / Bài</p>
                            <h4 className="text-3xl font-black">{Math.round((analyticsData?.total_views || 0) / (stats.total_articles || 1))}</h4>
                            <div className="mt-4 p-2 bg-white/10 rounded-lg inline-block text-[10px] font-bold">
                                HIỆU SUẤT TỐT
                            </div>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Tỷ lệ bình luận</p>
                            <h4 className="text-3xl font-black">{((analyticsData?.total_comments || 0) / (analyticsData?.total_views || 1) * 100).toFixed(1)}%</h4>
                            <div className="mt-4 p-2 bg-white/10 rounded-lg inline-block text-[10px] font-bold">
                                MỨC ĐỘ TƯƠNG TÁC
                            </div>
                        </div>
                        <div className="col-span-2 pt-4 border-t border-white/10">
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">Lời khuyên hệ thống</p>
                            <p className="text-sm text-gray-200">
                                Lượt xem của bạn tăng <span className="text-green-400 font-bold">+{stats.reader_trend}%</span> so với tuần trước.
                                Hãy thử đẩy mạnh các bài viết thu hút nhiều bình luận để tăng tương tác.
                            </p>
                        </div>
                    </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
                <div className="absolute right-10 top-10 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl"></div>
            </div>
        </div>
    );
}
