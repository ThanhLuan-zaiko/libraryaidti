"use client";

import { useEffect, useState } from "react";
import { dashboardService, AnalyticsData } from "@/services/dashboard.service";
import TagBarChart from "../charts/TagBarChart"; // You might need to make this generic or update it
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { FiFileText, FiEye, FiMessageSquare, FiActivity } from "react-icons/fi";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function CategoryAnalytics() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await dashboardService.getAnalytics();
                setData(result);
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="py-20 flex justify-center items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Tổng bài viết"
                    value={data.total_articles}
                    icon={<FiFileText size={24} />}
                    color="bg-blue-100 text-blue-600"
                />
                <StatCard
                    title="Tổng lượt xem"
                    value={data.total_views}
                    icon={<FiEye size={24} />}
                    color="bg-green-100 text-green-600"
                />
                <StatCard
                    title="Tổng bình luận"
                    value={data.total_comments}
                    icon={<FiMessageSquare size={24} />}
                    color="bg-purple-100 text-purple-600"
                />
                <StatCard
                    title="Hoạt động"
                    value="Active"
                    icon={<FiActivity size={24} />}
                    color="bg-orange-100 text-orange-600"
                />
            </div>

            {/* Charts Row 1: Trend & Category Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Xu hướng bài viết (30 ngày)</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.article_trend || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Phân bố danh mục</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={(data.top_categories || []) as any}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="article_count"
                                    nameKey="name"
                                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {(data.top_categories || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Charts Row 2: Top Tags */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Top Thẻ được sử dụng</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.top_tags || []}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="usage_count" fill="#82ca9d" radius={[4, 4, 0, 0]} barSize={50} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow">
            <div className={`p-4 rounded-xl ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">{title}</p>
                <h4 className="text-2xl font-bold text-gray-800 mt-1">{value}</h4>
            </div>
        </div>
    );
}
