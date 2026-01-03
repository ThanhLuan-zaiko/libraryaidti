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
import { FiCpu, FiLayers, FiClock } from 'react-icons/fi';

interface WorkflowBottlenecksProps {
    stats: {
        status: string;
        avg_days: number;
    }[];
}

const WorkflowBottlenecks: React.FC<WorkflowBottlenecksProps> = ({ stats }) => {
    const formattedData = stats.map(s => ({
        name: s.status,
        days: parseFloat(s.avg_days.toFixed(1))
    }));

    const avgTotal = stats.reduce((acc, curr) => acc + curr.avg_days, 0) / (stats.length || 1);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-purple-50/20">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <FiCpu className="text-purple-600" />
                    Hiệu suất Quy trình (Workflow)
                </h3>
            </div>

            <div className="p-6 flex-1 flex flex-col space-y-8">
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={formattedData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                            <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="days" radius={[6, 6, 0, 0]} barSize={40}>
                                {formattedData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.name === 'PUBLISHED' ? '#10b981' : entry.name === 'REVIEW' ? '#f59e0b' : '#8b5cf6'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                        <div className="flex items-center gap-2 mb-1">
                            <FiClock className="text-purple-600 w-4 h-4" />
                            <p className="text-[10px] font-bold text-purple-600 uppercase">Thời gian trung bình</p>
                        </div>
                        <p className="text-2xl font-black text-purple-900">{avgTotal.toFixed(1)} ngày</p>
                        <p className="text-[10px] text-purple-400 mt-1 italic">Toàn bộ quy trình</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col justify-center">
                        <div className="flex items-center gap-2">
                            <FiLayers className="text-gray-400 w-4 h-4" />
                            <p className="text-xs text-gray-500 font-medium leading-tight">
                                Trạng thái <span className="font-bold text-gray-800">REVIEW</span> đang tốn nhiều thời gian nhất.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkflowBottlenecks;
