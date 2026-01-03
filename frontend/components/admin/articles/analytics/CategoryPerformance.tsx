"use client";

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { FiLayers } from 'react-icons/fi';
import { CategoryStats } from '@/services/category.service';

interface CategoryPerformanceProps {
    categories: CategoryStats[];
}

const CategoryPerformance: React.FC<CategoryPerformanceProps> = ({ categories }) => {
    // Elegant colors for the chart
    const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <FiLayers className="text-blue-600" />
                    Hiệu suất theo Danh mục
                </h3>
            </div>
            <div className="p-6 flex-1 flex flex-col">
                <div className="h-[300px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categories} layout="vertical" margin={{ left: 20, right: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }}
                                width={120}
                            />
                            <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="article_count" radius={[0, 4, 4, 0]} barSize={24}>
                                {categories.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                    {categories.slice(0, 2).map((cat, idx) => (
                        <div key={cat.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{cat.name}</p>
                            <p className="text-xl font-black text-gray-900">{cat.article_count} bài</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CategoryPerformance;
