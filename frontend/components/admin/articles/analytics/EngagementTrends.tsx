"use client";

import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface EngagementTrendsProps {
    analytics: any[];
}

export default function EngagementTrends({ analytics }: EngagementTrendsProps) {
    return (
        <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <div className="drop-shadow-sm">
                    <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Xu hướng tương tác</h3>
                    <p className="text-[10px] text-gray-500 mt-1">Dữ liệu 30 ngày gần nhất</p>
                </div>
                <div className="flex gap-4 text-xs font-medium">
                    <span className="flex items-center gap-1.5 ">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span> Bài viết mới
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span> Lượt xem
                    </span>
                </div>
            </div>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics}>
                        <defs>
                            <linearGradient id="colorArticles" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 11 }}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="articles"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorArticles)"
                            name="Bài viết"
                        />
                        <Area
                            type="monotone"
                            dataKey="views"
                            stroke="#10b981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorViews)"
                            name="Lượt xem"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
