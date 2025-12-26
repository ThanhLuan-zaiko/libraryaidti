"use client";

import { useEffect, useState } from "react";
import { getDashboardData, DashboardData } from "@/services/dashboard.service";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";
import AdminCharts from "@/components/admin/AdminCharts";

export default function AdminDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const result = await getDashboardData();
                setData(result);
            } catch (err) {
                console.error("Failed to fetch dashboard data:", err);
                setError("Không thể tải dữ liệu thống kê.");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
                {error}
            </div>
        );
    }

    const { stats, activities, analytics, category_distribution } = data || {
        stats: null,
        activities: [],
        analytics: [],
        category_distribution: []
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Stats Cards */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Tổng số bài viết</p>
                    <h3 className="text-3xl font-bold mt-2 text-gray-800">{stats?.total_articles || 0}</h3>
                    <p className="text-xs text-green-600 mt-2 flex items-center">
                        <span className="mr-1">↑</span> {stats?.article_trend}% kể từ tháng trước
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Tổng số độc giả</p>
                    <h3 className="text-3xl font-bold mt-2 text-gray-800">{(stats?.total_readers || 0).toLocaleString()}</h3>
                    <p className="text-xs text-green-600 mt-2 flex items-center">
                        <span className="mr-1">↑</span> {stats?.reader_trend}% kể từ tuần trước
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Danh mục</p>
                    <h3 className="text-3xl font-bold mt-2 text-gray-800">{stats?.total_categories || 0}</h3>
                    <p className="text-xs text-gray-400 mt-2 italic">Không thay đổi</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Bài viết chờ duyệt</p>
                    <h3 className="text-3xl font-bold mt-2 text-gray-800">{stats?.pending_posts || 0}</h3>
                    <p className="text-xs text-yellow-600 mt-2 flex items-center">
                        <span className="mr-1">●</span> Cần xem xét sớm
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                    <AdminCharts
                        analytics={analytics}
                        categories={category_distribution}
                    />
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h4 className="font-bold text-gray-800 mb-4">Lối tắt nhanh</h4>
                    <div className="grid grid-cols-1 gap-3">
                        <Link href="/admin/articles/" className="flex items-center p-4 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all group">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mr-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <span className="text-xl font-bold">+</span>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800 text-sm">Bài viết mới</p>
                                <p className="text-xs text-gray-500">Soạn thảo bài viết mới</p>
                            </div>
                        </Link>
                        <Link href="/admin/categories" className="flex items-center p-4 border border-gray-100 rounded-xl hover:bg-green-50 hover:border-green-200 transition-all group">
                            <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mr-3 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                <span className="text-xl font-bold">▦</span>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800 text-sm">Danh mục</p>
                                <p className="text-xs text-gray-500">Quản lý chuyên mục</p>
                            </div>
                        </Link>
                        <Link href="/admin/users" className="flex items-center p-4 border border-gray-100 rounded-xl hover:bg-purple-50 hover:border-purple-200 transition-all group">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mr-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                <span className="text-xl font-bold">👤</span>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800 text-sm">Người dùng</p>
                                <p className="text-xs text-gray-500">Quản lý thành viên</p>
                            </div>
                        </Link>
                        <Link href="/admin/settings" className="flex items-center p-4 border border-gray-100 rounded-xl hover:bg-orange-50 hover:border-orange-200 transition-all group">
                            <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center mr-3 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                <span className="text-xl font-bold">⚙</span>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800 text-sm">Cài đặt</p>
                                <p className="text-xs text-gray-500">Cấu hình hệ thống</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="font-bold text-gray-800 mb-4">Hoạt động gần đây</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activities.length > 0 ? (
                        activities.map((activity) => (
                            <div key={activity.id} className="p-4 border border-gray-50 rounded-xl hover:bg-gray-50 transition-colors flex items-start space-x-3">
                                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${activity.type === "article_published" ? "bg-green-500" :
                                    activity.type === "user_registered" ? "bg-blue-500" :
                                        "bg-yellow-500"
                                    }`}></div>
                                <div>
                                    <p className="text-sm text-gray-600 font-medium">{activity.content}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: vi })}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-400 italic">Không có hoạt động nào gần đây.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

