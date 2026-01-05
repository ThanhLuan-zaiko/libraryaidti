"use client";

import { TagStats } from "@/services/tag.service";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface TagStatsSectionProps {
    stats: TagStats[];
    loading: boolean;
}

export default function TagStatsSection({ stats, loading }: TagStatsSectionProps) {
    if (loading || !stats || stats.length === 0) return null;

    return (
        <div className="p-6 border-b border-gray-200 bg-white">
            <h3 className="font-bold text-gray-800 mb-4">Các thẻ được sử dụng nhiều nhất</h3>
            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="usage_count" fill="#8884d8" radius={[4, 4, 0, 0]} name="Số bài viết" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
