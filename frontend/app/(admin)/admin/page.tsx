"use client";

import { useEffect, useState } from "react";
import { dashboardService, SuperDashboardData } from "@/services/dashboard.service";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";
import AdminCharts from "@/components/admin/AdminCharts";
import DashboardCard from "@/components/admin/dashboard/DashboardCard";
import {
    HiOutlineDocumentText,
    HiOutlineEye,
    HiOutlineChatAlt2,
    HiOutlineUsers,
    HiOutlineLibrary,
    HiOutlineTag,
    HiOutlineExclamationCircle,
    HiOutlineDatabase,
    HiOutlineChartBar
} from "react-icons/hi";
import {
    MdOutlineDashboardCustomize,
    MdOutlineSmsFailed,
    MdOutlineShare
} from "react-icons/md";

import SystemPulse from "@/components/admin/dashboard/SystemPulse";
import ActivityHeatmapChart from "@/components/admin/dashboard/ActivityHeatmap";
import EditorialVelocity from "@/components/admin/dashboard/EditorialVelocity";

export default function AdminDashboard() {
    const [data, setData] = useState<SuperDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const result = await dashboardService.getSuperDashboard();
                setData(result);
            } catch (err) {
                setError("Không thể tải dữ liệu thống kê từ Super Dashboard.");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[600px]">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
                    <p className="text-gray-500 font-medium">Đang chuẩn bị dữ liệu quản trị...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex items-center space-x-3">
                <HiOutlineExclamationCircle className="w-6 h-6" />
                <p>{error}</p>
            </div>
        );
    }

    if (!data) return null;

    const { stats, advanced, user_stats, engagement, system, pulse, heatmap, velocity } = data;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header section with summary */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Bảng điều khiển tổng quan</h1>
                    <p className="text-gray-500 mt-1">Command Center (Hệ thống quản trị tập trung)</p>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={async () => {
                            try {
                                const blob = await dashboardService.exportReport();
                                const url = window.URL.createObjectURL(new Blob([blob]));
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', `dashboard-report-${new Date().toISOString().split('T')[0]}.csv`);
                                document.body.appendChild(link);
                                link.click();
                                link.remove();
                            } catch (e) {
                                console.error("Export failed", e);
                            }
                        }}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Xuất báo cáo
                    </button>
                    <Link href="/admin/articles/create" className="px-4 py-2 bg-blue-600 rounded-xl text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
                        + Bài viết mới
                    </Link>
                </div>
            </div>

            {/* Phase 2: System Pulse (Command Center Exclusive) */}
            <SystemPulse data={pulse} />

            {/* Main stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardCard
                    title="Tổng số bài viết"
                    value={stats.total_articles}
                    icon={<HiOutlineDocumentText className="w-6 h-6" />}
                    trend={{
                        value: Number(((stats.article_trend.reduce((acc, curr) => acc + curr.count, 0) / (stats.total_articles > 0 ? stats.total_articles : 1)) * 100).toFixed(1)),
                        label: "30 ngày qua",
                        isPositive: true
                    }}
                    color="blue"
                />
                <DashboardCard
                    title="Tổng lượt xem"
                    value={stats.total_views.toLocaleString()}
                    icon={<HiOutlineEye className="w-6 h-6" />}
                    description="Tổng lượt xem toàn trang"
                    color="purple"
                />
                <DashboardCard
                    title="Độc giả hoạt động"
                    value={user_stats.active_users.toLocaleString()}
                    icon={<HiOutlineUsers className="w-6 h-6" />}
                    description="Người dùng đang hoạt động"
                    color="green"
                />
                <DashboardCard
                    title="Danh mục"
                    value={stats.total_categories}
                    icon={<HiOutlineLibrary className="w-6 h-6" />}
                    description="Cấu trúc nội dung hiện tại"
                    color="indigo"
                />
            </div>

            {/* Second Row: Detailed Insights & Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                    <AdminCharts
                        analytics={stats.article_trend.map(t => ({ date: t.date, articles: t.count, views: 0 }))}
                        categories={stats.top_categories.map(c => ({ name: c.name, value: Number(c.article_count) }))}
                    />
                </div>

                <div className="space-y-6">
                    {/* SEO Health Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-gray-800 flex items-center">
                                <HiOutlineChartBar className="w-5 h-5 mr-2 text-blue-500" />
                                Sức khỏe nội dung
                            </h4>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-500">Mô tả Meta (Thiếu)</span>
                                    <span className="font-bold text-red-500">{advanced.seo_stats.missing_meta_description}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div
                                        className="bg-red-500 h-1.5 rounded-full transition-all duration-500"
                                        style={{ width: `${(advanced.seo_stats.missing_meta_description / stats.total_articles) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-500">Ảnh OG (Thiếu)</span>
                                    <span className="font-bold text-orange-500">{advanced.seo_stats.missing_og_image}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div
                                        className="bg-orange-500 h-1.5 rounded-full transition-all duration-500"
                                        style={{ width: `${(advanced.seo_stats.missing_og_image / stats.total_articles) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-500">Độ dài đạt chuẩn</span>
                                    <span className="font-bold text-green-500 text-right">{advanced.content_health.good_content_length} bài</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div
                                        className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                                        style={{ width: `${(advanced.content_health.good_content_length / stats.total_articles) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                        <Link href="/admin/advanced-analytics" className="mt-6 block text-center py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                            Xem chi tiết SEO →
                        </Link>
                    </div>

                    {/* Engagement Quick Stats */}
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-100">
                        <h4 className="font-bold mb-4 flex items-center">
                            <MdOutlineDashboardCustomize className="w-5 h-5 mr-2" />
                            Tương tác hệ thống
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/10 p-3 rounded-xl border border-white/20">
                                <p className="text-[10px] text-indigo-100 uppercase font-bold">Bình luận</p>
                                <p className="text-xl font-bold">{engagement.total_comments}</p>
                            </div>
                            <div className="bg-white/10 p-3 rounded-xl border border-white/20">
                                <p className="text-[10px] text-indigo-100 uppercase font-bold">Chia sẻ</p>
                                <p className="text-xl font-bold">{engagement.total_shares}</p>
                            </div>
                            <div className="bg-white/10 p-3 rounded-xl border border-white/20">
                                <p className="text-[10px] text-indigo-100 uppercase font-bold">Nổi bật</p>
                                <p className="text-xl font-bold">{engagement.featured_count}</p>
                            </div>
                            <div className="bg-white/10 p-3 rounded-xl border border-white/20">
                                <p className="text-[10px] text-indigo-100 uppercase font-bold">Thùng rác</p>
                                <p className="text-xl font-bold">{engagement.deleted_comments}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Phase 2: Operational Velocity & Traffic */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                    <EditorialVelocity data={velocity} />
                </div>
                <div className="lg:col-span-3">
                    <ActivityHeatmapChart data={heatmap} />
                </div>
            </div>

            {/* Bottom Row: Activities and System Logs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Logs/Audit */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="font-bold text-gray-800 flex items-center">
                            <HiOutlineDatabase className="w-5 h-5 mr-2 text-orange-500" />
                            Nhật ký hệ thống
                        </h4>
                        <span className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-lg font-bold">
                            {system.total_logs} tổng số
                        </span>
                    </div>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {system.recent_audit_logs && system.recent_audit_logs.length > 0 ? (
                            system.recent_audit_logs.map((log) => (
                                <div key={log.id} className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${log.action.includes("DELETE") ? "bg-red-50 text-red-500" :
                                        log.action.includes("UPDATE") ? "bg-blue-50 text-blue-500" :
                                            "bg-green-50 text-green-500"
                                        }`}>
                                        <span className="text-xs font-bold">{log.action[0]}</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-gray-800 truncate">
                                            {log.action} <span className="text-gray-400 font-normal">trên</span> {log.table_name}
                                        </p>
                                        <div className="flex items-center text-[10px] text-gray-400 mt-1">
                                            <span>ID: {(log.record_id || "").toString().substring(0, 8)}...</span>
                                            <span className="mx-2">•</span>
                                            <span>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: vi })}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-400 italic text-center py-10">Chưa có nhật ký hoạt động nào.</p>
                        )}
                    </div>
                </div>

                {/* Media and File Stats */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h4 className="font-bold text-gray-800 mb-6 flex items-center">
                        <HiOutlineChartBar className="w-5 h-5 mr-2 text-purple-500" />
                        Lưu trữ & Tệp tin
                    </h4>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-xs text-gray-500 font-medium">Tổng tệp tin</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">{advanced.media_stats.total_files}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-xs text-gray-500 font-medium">Dung lượng</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">{(advanced.media_stats.total_size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                    </div>

                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Lối tắt cấu hình</h5>
                    <div className="grid grid-cols-2 gap-3">
                        <Link href="/admin/users" className="flex items-center p-3 rounded-xl bg-blue-50/50 hover:bg-blue-50 border border-blue-100/50 transition-colors group">
                            <HiOutlineUsers className="w-5 h-5 text-blue-500 mr-2 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold text-blue-700">Người dùng</span>
                        </Link>
                        <Link href="/admin/settings" className="flex items-center p-3 rounded-xl bg-orange-50/50 hover:bg-orange-50 border border-orange-100/50 transition-colors group">
                            <HiOutlineDatabase className="w-5 h-5 text-orange-500 mr-2 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold text-orange-700">Hệ thống</span>
                        </Link>
                        <Link href="/admin/categories" className="flex items-center p-3 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/50 transition-colors group">
                            <HiOutlineLibrary className="w-5 h-5 text-indigo-500 mr-2 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold text-indigo-700">Danh mục</span>
                        </Link>
                        <Link href="/admin/tags" className="flex items-center p-3 rounded-xl bg-purple-50/50 hover:bg-purple-50 border border-purple-100/50 transition-colors group">
                            <HiOutlineTag className="w-5 h-5 text-purple-500 mr-2 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold text-purple-700">Thẻ bài viết</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div >
    );
}

